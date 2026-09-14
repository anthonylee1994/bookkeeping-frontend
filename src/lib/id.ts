import {v4 as uuidV4} from "uuid";
import type {UUID} from "../data/types";

export function createId(): UUID {
    return uuidV4();
}
