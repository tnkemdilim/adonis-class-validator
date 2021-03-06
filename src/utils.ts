import {
  ClassValidatorBag,
  Class,
  SchemaType,
} from "@ioc:Adonis/ClassValidator/Shared";
import { TypedSchema, CustomMessages } from "@ioc:Adonis/Core/Validator";

/**
 * Get the typed schema of a nested validator class.
 * @param nestedClass Validator class
 * @returns Typed schema of validator class.
 */
export const nested = <T>(nestedClass: Class<T>): TypedSchema =>
  getValidatorBag(nestedClass).schema;

/**
 * Get the validation bag of a target.
 *
 * If none exists, target is initialized with an empty bag.
 * @param target Target
 * @returns Validation Schema.
 */
export const getValidatorBag = (target: any): ClassValidatorBag => {
  if (target.constructor.name === "Object") {
    return { key: "", messages: {}, schema: {} };
  }

  const prototype = target?.prototype || target;
  const metadataKey = `@${prototype.constructor.name}.classValidatorBag`;
  const metadata = Reflect.getMetadata(metadataKey, prototype);
  if (metadata) return metadata;

  const key = `${nonce()}.${prototype.constructor.name}`;
  const parentBag = getValidatorBag(Object.getPrototypeOf(target));
  const validatorBag = {
    schema: Object.assign({}, parentBag.schema),
    messages: Object.assign({}, parentBag.messages),
    key,
  };

  Reflect.defineMetadata(metadataKey, validatorBag, prototype);
  return Reflect.getMetadata(metadataKey, prototype);
};

/**
 * Converts messages field name into a format compatible with Adonis.
 * @param fieldName Field name
 * @param messages Messages rules for the field specified
 * @returns Transformed messages
 */
export const transformMessages = (
  fieldName: string,
  messages: CustomMessages,
  isArray = false
) =>
  Object.entries(messages).reduce((prev, [key, value]) => {
    prev[`${fieldName}${isArray ? ".*." : "."}${key}`] = value;
    return prev;
  }, {});

/**
 * Check if a schema is an array schema.
 * @param schema Schema to check.
 * @returns If schema is an array.
 */
export const schemaIsArray = (schema: SchemaType) =>
  "getTree" in schema && (schema as any).getTree().type === "array";

/**
 * Check if a schema is a date schema.
 * @param schema Schema to check.
 * @returns If schema is date.
 */
export const schemaIsDate = (schema: SchemaType) => {
  return "getTree" in schema && (schema as any).getTree().subtype === "date";
};

/**
 * Generate a unique and ever increasing nonce of length 15.
 * @returns Unique number
 */
export const nonce = ((length: number = 15) => {
  let [last, repeat] = [Date.now(), 0];

  return () => {
    const now = Math.pow(10, 2) * +new Date();
    if (now === last) repeat++;
    else [last, repeat] = [now, 0];

    const s = (now + repeat).toString();
    return +s.substr(s.length - length);
  };
})();
