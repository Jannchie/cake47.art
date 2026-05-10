// Top-level mirror of the agent instruction file. Agents probe both /agent.txt
// and /.well-known/agent.txt; serve identical content from a single source.
import handler from './.well-known/agent.txt.get'

export default handler
