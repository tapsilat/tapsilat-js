/** What a redacted secret prints as */
export const REDACTED = "[redacted]";

/** The hook Node.js calls when console.log or util.inspect prints an object */
const INSPECT = Symbol.for("nodejs.util.inspect.custom");

/**
 * Makes console.log and util.inspect print an object's `client_secret` as "[redacted]"
 *
 * @summary Keep a client secret out of logs
 * @description
 * Adds a non-enumerable inspect hook to the object itself, so JSON.stringify, property access and
 * Object.keys still see the real secret. A copy made with spread or structuredClone does not keep
 * the hook.
 *
 * @param value - A response object that carries `client_secret`
 * @returns The same object
 */
export const redactClientSecret = <T extends object>(value: T): T => {
  if (value && typeof value === "object" && "client_secret" in value) {
    Object.defineProperty(value, INSPECT, {
      value: function (this: Record<string, unknown>): Record<string, unknown> {
        return { ...this, client_secret: REDACTED };
      },
      enumerable: false,
      configurable: true,
      writable: true,
    });
  }
  return value;
};
