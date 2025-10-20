import { createClient } from '@/lib/supabase/client'
import { UserInvite, InviteError } from '@/lib/types'
import { sendEmail } from '@/lib/email/mailer'
import { generateInviteEmail } from '@/lib/email/templates/user-invite'
import crypto from 'crypto'

/**
 * Invite Service
 * 
 * Handles user invitation functionality including:
 * - Creating invites with unique tokens
 * - Validating invite tokens
 * - Accepting invites and updating user groups
 */

interface CreateInviteParams {
  email: string
  groupId: string
  invitedBy: string
  inviterName?: string
}

interface AcceptInviteParams {
  token: string
  userId: string
}

/**
 * Creates a new user invite with a unique token and sends invitation email
 * 
 * @param params - Invite creation parameters
 * @returns Promise<UserInvite> - The created invite record
 * @throws InviteError - If invite creation fails
 */
export async function createInvite(params: CreateInviteParams): Promise<UserInvite> {
  const { email, groupId, invitedBy, inviterName } = params
  const supabase = createClient()

  try {
    // Generate unique token using crypto
    const token = crypto.randomBytes(32).toString('hex')
    
    // Set expiry to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Check if there's already a pending invite for this email
    const { data: existingInvite } = await supabase
      .from('user_invites')
      .select('id, status')
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvite) {
      throw new InviteError(`Já existe um convite pendente para o email ${email}`)
    }

    // Verify that the group exists
    const { data: group, error: groupError } = await supabase
      .from('user_groups')
      .select('id, name')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      throw new InviteError('Grupo de usuário não encontrado')
    }

    // Get inviter name if not provided
    let finalInviterName = inviterName
    if (!finalInviterName && invitedBy) {
      const { data: inviterUser } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', invitedBy)
        .single()
      
      finalInviterName = inviterUser?.full_name || 'Equipe AvaliaTec'
    }

    // Create invite record in database
    const { data: invite, error: inviteError } = await supabase
      .from('user_invites')
      .insert({
        email,
        group_id: groupId,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        invited_by: invitedBy
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      throw new InviteError('Erro ao criar convite: ' + inviteError.message)
    }

    // Send invitation email
    try {
      const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite?token=${token}`
      
      const emailOptions = generateInviteEmail({
        recipientEmail: email,
        groupName: group.name,
        inviteLink,
        inviterName: finalInviterName || 'Equipe AvaliaTec',
        expiresAt: expiresAt.toISOString()
      })

      const emailResult = await sendEmail(emailOptions)

      if (!emailResult.success) {
        // Log email failure but don't fail the invite creation
        console.error('Failed to send invite email:', {
          email,
          error: emailResult.error,
          inviteId: invite.id
        })
        
        // Could optionally update invite status to indicate email failed
        // but for now we'll just log it for audit purposes
      } else {
        console.log('Invite email sent successfully:', {
          email,
          messageId: emailResult.messageId,
          inviteId: invite.id
        })
      }
    } catch (emailError) {
      // Log email send failure but don't fail the invite creation
      console.error('Error sending invite email:', {
        email,
        error: emailError,
        inviteId: invite.id
      })
    }

    return invite as UserInvite
  } catch (error) {
    if (error instanceof InviteError) {
      throw error
    }
    console.error('Unexpected error creating invite:', error)
    throw new InviteError('Erro inesperado ao criar convite')
  }
}

/**
 * Validates an invite token and checks if it's still valid
 * 
 * @param token - The invite token to validate
 * @returns Promise<UserInvite | null> - The invite record if valid, null otherwise
 */
export async function validateInviteToken(token: string): Promise<UserInvite | null> {
  const supabase = createClient()

  try {
    // Find invite by token
    const { data: invite, error } = await supabase
      .from('user_invites')
      .select(`
        *,
        user_groups!inner(id, name)
      `)
      .eq('token', token)
      .single()

    if (error || !invite) {
      return null
    }

    // Check if invite is still pending
    if (invite.status !== 'pending') {
      return null
    }

    // Check if invite has expired
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (now > expiresAt) {
      // Mark invite as expired
      await supabase
        .from('user_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)
      
      return null
    }

    return invite as UserInvite
  } catch (error) {
    console.error('Error validating invite token:', error)
    return null
  }
}

/**
 * Accepts an invite by updating the user's group and marking invite as accepted
 * 
 * @param params - Accept invite parameters
 * @returns Promise<void>
 * @throws InviteError - If invite acceptance fails
 */
export async function acceptInvite(params: AcceptInviteParams): Promise<void> {
  const { token, userId } = params
  const supabase = createClient()

  try {
    // First validate the token
    const invite = await validateInviteToken(token)
    
    if (!invite) {
      throw new InviteError('Token de convite inválido ou expirado')
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      throw new InviteError('Usuário não encontrado')
    }

    // Verify that the invite email matches the user email
    if (user.email !== invite.email) {
      throw new InviteError('Email do usuário não corresponde ao convite')
    }

    // Update user's group
    const { error: updateUserError } = await supabase
      .from('users')
      .update({ 
        group_id: invite.group_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateUserError) {
      console.error('Error updating user group:', updateUserError)
      throw new InviteError('Erro ao atualizar grupo do usuário')
    }

    // Mark invite as accepted
    const { error: updateInviteError } = await supabase
      .from('user_invites')
      .update({ status: 'accepted' })
      .eq('id', invite.id)

    if (updateInviteError) {
      console.error('Error updating invite status:', updateInviteError)
      // This is not critical, user group was already updated
    }

  } catch (error) {
    if (error instanceof InviteError) {
      throw error
    }
    console.error('Unexpected error accepting invite:', error)
    throw new InviteError('Erro inesperado ao aceitar convite')
  }
}

/**
 * Gets all pending invites (admin function)
 * 
 * @returns Promise<UserInvite[]> - Array of pending invites
 */
export async function getPendingInvites(): Promise<UserInvite[]> {
  const supabase = createClient()

  try {
    const { data: invites, error } = await supabase
      .from('user_invites')
      .select(`
        *,
        user_groups!inner(id, name),
        invited_by_user:users!user_invites_invited_by_fkey(id, full_name)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending invites:', error)
      throw new InviteError('Erro ao buscar convites pendentes')
    }

    return invites as UserInvite[]
  } catch (error) {
    if (error instanceof InviteError) {
      throw error
    }
    console.error('Unexpected error fetching invites:', error)
    throw new InviteError('Erro inesperado ao buscar convites')
  }
}

/**
 * Resends an invitation email for a pending invite
 * 
 * @param inviteId - The ID of the invite to resend
 * @param inviterName - Optional name of the person resending
 * @returns Promise<void>
 * @throws InviteError - If resend fails
 */
export async function resendInvite(inviteId: string, inviterName?: string): Promise<void> {
  const supabase = createClient()

  try {
    // Get the invite details
    const { data: invite, error: inviteError } = await supabase
      .from('user_invites')
      .select(`
        *,
        user_groups!inner(id, name)
      `)
      .eq('id', inviteId)
      .eq('status', 'pending')
      .single()

    if (inviteError || !invite) {
      throw new InviteError('Convite não encontrado ou não está pendente')
    }

    // Check if invite has expired
    const now = new Date()
    const expiresAt = new Date(invite.expires_at)
    
    if (now > expiresAt) {
      throw new InviteError('Convite expirado. Crie um novo convite.')
    }

    // Send invitation email
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/invite?token=${invite.token}`
    
    const emailOptions = generateInviteEmail({
      recipientEmail: invite.email,
      groupName: invite.user_groups.name,
      inviteLink,
      inviterName: inviterName || 'Equipe AvaliaTec',
      expiresAt: invite.expires_at
    })

    const emailResult = await sendEmail(emailOptions)

    if (!emailResult.success) {
      console.error('Failed to resend invite email:', {
        email: invite.email,
        error: emailResult.error,
        inviteId: invite.id
      })
      throw new InviteError('Erro ao reenviar email de convite: ' + emailResult.error)
    }

    console.log('Invite email resent successfully:', {
      email: invite.email,
      messageId: emailResult.messageId,
      inviteId: invite.id
    })

  } catch (error) {
    if (error instanceof InviteError) {
      throw error
    }
    console.error('Unexpected error resending invite:', error)
    throw new InviteError('Erro inesperado ao reenviar convite')
  }
}

/**
 * Cancels a pending invite
 * 
 * @param inviteId - The ID of the invite to cancel
 * @returns Promise<void>
 * @throws InviteError - If cancellation fails
 */
export async function cancelInvite(inviteId: string): Promise<void> {
  const supabase = createClient()

  try {
    const { error } = await supabase
      .from('user_invites')
      .delete()
      .eq('id', inviteId)
      .eq('status', 'pending') // Only allow canceling pending invites

    if (error) {
      console.error('Error canceling invite:', error)
      throw new InviteError('Erro ao cancelar convite')
    }
  } catch (error) {
    if (error instanceof InviteError) {
      throw error
    }
    console.error('Unexpected error canceling invite:', error)
    throw new InviteError('Erro inesperado ao cancelar convite')
  }
}