-- WhatsApp Integration Schema
-- This migration creates all tables needed for WhatsApp functionality via Evolution API

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: whatsapp_instances
-- Stores information about connected WhatsApp instances
CREATE TABLE whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL UNIQUE,
  instance_token TEXT NOT NULL,
  phone_number TEXT,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (
    status IN ('disconnected', 'connecting', 'connected', 'qr_code')
  ),
  qr_code TEXT,
  qr_code_updated_at TIMESTAMPTZ,
  webhook_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  connected_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ
);

-- Table: whatsapp_contacts
-- Stores information about WhatsApp contacts
CREATE TABLE whatsapp_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE CASCADE NOT NULL,
  remote_jid TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  name TEXT,
  profile_picture_url TEXT,
  contact_type TEXT CHECK (
    contact_type IN ('cliente', 'lead', 'profissional', 'prestador', 'unknown')
  ) DEFAULT 'unknown',
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(instance_id, remote_jid)
);

-- Table: whatsapp_messages
-- Stores all sent and received WhatsApp messages
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE NOT NULL,
  message_id TEXT NOT NULL,
  remote_jid TEXT NOT NULL,
  from_me BOOLEAN NOT NULL DEFAULT false,
  message_type TEXT NOT NULL CHECK (
    message_type IN ('text', 'audio', 'image', 'video', 'document', 'sticker', 'location', 'contact', 'other')
  ),
  text_content TEXT,
  media_url TEXT,
  media_mime_type TEXT,
  media_size BIGINT,
  media_filename TEXT,
  quoted_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'sent', 'delivered', 'read', 'failed')
  ),
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(instance_id, message_id)
);

-- Table: whatsapp_quick_messages
-- Stores configurable quick messages with shortcuts
CREATE TABLE whatsapp_quick_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shortcut TEXT NOT NULL UNIQUE,
  message_text TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: whatsapp_instance_settings
-- Stores configuration settings for each WhatsApp instance
CREATE TABLE whatsapp_instance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE CASCADE NOT NULL UNIQUE,
  reject_calls BOOLEAN NOT NULL DEFAULT false,
  reject_call_message TEXT,
  ignore_groups BOOLEAN NOT NULL DEFAULT true,
  always_online BOOLEAN NOT NULL DEFAULT false,
  read_messages BOOLEAN NOT NULL DEFAULT false,
  read_status BOOLEAN NOT NULL DEFAULT false,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT false,
  auto_reply_message TEXT,
  availability_schedule JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: whatsapp_auto_reply_log
-- Logs automatic replies sent to prevent duplicates
CREATE TABLE whatsapp_auto_reply_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID REFERENCES whatsapp_instances(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES whatsapp_contacts(id) ON DELETE CASCADE NOT NULL,
  message_sent TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance optimization

-- Indexes for whatsapp_instances
CREATE INDEX idx_whatsapp_instances_status ON whatsapp_instances(status);
CREATE INDEX idx_whatsapp_instances_created_by ON whatsapp_instances(created_by);
CREATE INDEX idx_whatsapp_instances_instance_name ON whatsapp_instances(instance_name);

-- Indexes for whatsapp_contacts
CREATE INDEX idx_whatsapp_contacts_instance ON whatsapp_contacts(instance_id);
CREATE INDEX idx_whatsapp_contacts_remote_jid ON whatsapp_contacts(remote_jid);
CREATE INDEX idx_whatsapp_contacts_phone ON whatsapp_contacts(phone_number);
CREATE INDEX idx_whatsapp_contacts_client ON whatsapp_contacts(client_id);
CREATE INDEX idx_whatsapp_contacts_type ON whatsapp_contacts(contact_type);
CREATE INDEX idx_whatsapp_contacts_last_message ON whatsapp_contacts(last_message_at DESC);

-- Indexes for whatsapp_messages
CREATE INDEX idx_whatsapp_messages_instance ON whatsapp_messages(instance_id);
CREATE INDEX idx_whatsapp_messages_contact ON whatsapp_messages(contact_id);
CREATE INDEX idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);
CREATE INDEX idx_whatsapp_messages_from_me ON whatsapp_messages(from_me);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_message_id ON whatsapp_messages(message_id);

-- Indexes for whatsapp_quick_messages
CREATE INDEX idx_whatsapp_quick_messages_shortcut ON whatsapp_quick_messages(shortcut);
CREATE INDEX idx_whatsapp_quick_messages_created_by ON whatsapp_quick_messages(created_by);

-- Indexes for whatsapp_instance_settings
CREATE INDEX idx_whatsapp_instance_settings_instance ON whatsapp_instance_settings(instance_id);

-- Indexes for whatsapp_auto_reply_log
CREATE INDEX idx_whatsapp_auto_reply_log_instance ON whatsapp_auto_reply_log(instance_id);
CREATE INDEX idx_whatsapp_auto_reply_log_contact ON whatsapp_auto_reply_log(contact_id, sent_at DESC);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables with updated_at columns
CREATE TRIGGER update_whatsapp_instances_updated_at 
    BEFORE UPDATE ON whatsapp_instances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_contacts_updated_at 
    BEFORE UPDATE ON whatsapp_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_quick_messages_updated_at 
    BEFORE UPDATE ON whatsapp_quick_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_instance_settings_updated_at 
    BEFORE UPDATE ON whatsapp_instance_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default quick messages
INSERT INTO whatsapp_quick_messages (shortcut, message_text, description) VALUES
('/ola', 'Olá! Como posso ajudá-lo hoje?', 'Saudação padrão'),
('/horario', 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.', 'Informação sobre horário'),
('/obrigado', 'Obrigado pelo contato! Estaremos sempre à disposição.', 'Agradecimento padrão'),
('/aguarde', 'Por favor, aguarde um momento enquanto verifico essas informações para você.', 'Pedido de espera'),
('/indisponivel', 'No momento estou indisponível, mas retornarei seu contato assim que possível. Obrigado!', 'Mensagem de indisponibilidade');

-- Add comments to tables for documentation
COMMENT ON TABLE whatsapp_instances IS 'Stores WhatsApp instances connected via Evolution API';
COMMENT ON TABLE whatsapp_contacts IS 'Stores WhatsApp contacts and their associations with clients';
COMMENT ON TABLE whatsapp_messages IS 'Stores all WhatsApp messages sent and received';
COMMENT ON TABLE whatsapp_quick_messages IS 'Stores configurable quick messages with shortcuts';
COMMENT ON TABLE whatsapp_instance_settings IS 'Stores configuration settings for WhatsApp instances';
COMMENT ON TABLE whatsapp_auto_reply_log IS 'Logs automatic replies to prevent duplicates';