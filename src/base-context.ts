export default interface BaseContext {
  set_context: <T>(ctx: T) => void;
}