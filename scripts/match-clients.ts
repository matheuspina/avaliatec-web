#!/usr/bin/env tsx

/**
 * Client Matching CLI Script (TypeScript)
 * 
 * This script can be used to run automatic client matching from the command line
 * or as part of a cron job or scheduled task.
 * 
 * Usage:
 *   npx tsx scripts/match-clients.ts [options]
 * 
 * Options:
 *   --instance-id <id>    Match clients for specific instance only
 *   --batch-size <size>   Number of contacts to process in each batch (default: 10)
 *   --delay <ms>          Delay between batches in milliseconds (default: 100)
 *   --retries <count>     Maximum number of retries (default: 3)
 *   --stats-only          Only show statistics, don't run matching
 *   --help                Show this help message
 * 
 * Examples:
 *   npx tsx scripts/match-clients.ts
 *   npx tsx scripts/match-clients.ts --instance-id abc123 --batch-size 20
 *   npx tsx scripts/match-clients.ts --stats-only
 */

import { runClientMatchingJob, getClientMatchingStats } from '../lib/services/clientMatchingJob'

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    instanceId: null as string | null,
    batchSize: 10,
    delayBetweenBatches: 100,
    maxRetries: 3,
    statsOnly: false,
    help: false
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--instance-id':
        options.instanceId = args[++i]
        break
      case '--batch-size':
        options.batchSize = parseInt(args[++i]) || 10
        break
      case '--delay':
        options.delayBetweenBatches = parseInt(args[++i]) || 100
        break
      case '--retries':
        options.maxRetries = parseInt(args[++i]) || 3
        break
      case '--stats-only':
        options.statsOnly = true
        break
      case '--help':
        options.help = true
        break
      default:
        console.warn(`Unknown option: ${arg}`)
    }
  }

  return options
}

// Show help message
function showHelp() {
  console.log(`
Client Matching CLI Script

This script runs automatic client matching for WhatsApp contacts.

Usage:
  npx tsx scripts/match-clients.ts [options]

Options:
  --instance-id <id>    Match clients for specific instance only
  --batch-size <size>   Number of contacts to process in each batch (default: 10)
  --delay <ms>          Delay between batches in milliseconds (default: 100)
  --retries <count>     Maximum number of retries (default: 3)
  --stats-only          Only show statistics, don't run matching
  --help                Show this help message

Examples:
  npx tsx scripts/match-clients.ts
  npx tsx scripts/match-clients.ts --instance-id abc123 --batch-size 20
  npx tsx scripts/match-clients.ts --stats-only
`)
}

// Main execution function
async function main() {
  try {
    const options = parseArgs()

    if (options.help) {
      showHelp()
      process.exit(0)
    }

    console.log('🔄 WhatsApp Client Matching Script')
    console.log('==================================')

    if (options.statsOnly) {
      console.log('📊 Getting client matching statistics...')
      
      const stats = await getClientMatchingStats(options.instanceId || undefined)
      
      console.log('\n📈 Client Matching Statistics:')
      console.log(`   Total Contacts: ${stats.totalContacts}`)
      console.log(`   Matched Contacts: ${stats.matchedContacts}`)
      console.log(`   Unmatched Contacts: ${stats.unmatchedContacts}`)
      console.log(`   Matching Percentage: ${stats.matchingPercentage}%`)
      
      if (options.instanceId) {
        console.log(`   Instance ID: ${options.instanceId}`)
      }
      
    } else {
      console.log('🚀 Starting client matching job...')
      console.log(`   Instance ID: ${options.instanceId || 'all'}`)
      console.log(`   Batch Size: ${options.batchSize}`)
      console.log(`   Delay Between Batches: ${options.delayBetweenBatches}ms`)
      console.log(`   Max Retries: ${options.maxRetries}`)
      console.log('')

      const result = await runClientMatchingJob({
        instanceId: options.instanceId || undefined,
        batchSize: options.batchSize,
        delayBetweenBatches: options.delayBetweenBatches,
        maxRetries: options.maxRetries
      })

      console.log('\n✅ Client Matching Job Completed!')
      console.log('=================================')
      console.log(`   Success: ${result.success ? 'Yes' : 'No'}`)
      console.log(`   Matched Contacts: ${result.matchedCount}`)
      console.log(`   Total Processed: ${result.totalProcessed}`)
      console.log(`   Execution Time: ${result.executionTime}ms`)
      
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.length}`)
        result.errors.forEach((error, index) => {
          console.log(`     ${index + 1}. ${error}`)
        })
      }

      // Exit with appropriate code
      process.exit(result.success ? 0 : 1)
    }

  } catch (error) {
    console.error('❌ Error running client matching script:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

export { main, parseArgs, showHelp }