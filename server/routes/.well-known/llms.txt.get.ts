// Mirror of /llms.txt at the standard well-known path so agents that
// preferentially probe /.well-known/llms.txt get the same canonical content.
import handler from '../llms.txt.get'

export default handler
