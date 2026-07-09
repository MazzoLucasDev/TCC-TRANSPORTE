import type crypto = require("crypto");
import type { Name } from "./valueObjects/Name.js";



export type UserProps = {
    readonly id : crypto.UUID();
    name: Name;
    email:Email;

};