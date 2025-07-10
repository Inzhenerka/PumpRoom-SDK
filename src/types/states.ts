/**
 * Types for the States module
 * 
 * This file contains type definitions for the States module.
 * 
 * @module Types/States
 * @category States
 * @experimental
 */

/**
 * Enum for state data types
 * 
 * @public
 * @category States
 * @experimental
 */
export enum StateDataType {
    /** Boolean value */
    bool = 'bool',
    /** Integer value */
    int = 'int',
    /** String value */
    str = 'str',
    /** Null value */
    null = 'null'
}

/**
 * Interface representing a state input object
 * 
 * @public
 * @category States
 * @experimental
 */
export interface State {
    /** Name of the state */
    name: string;
    /** Value of the state (boolean, number, string, or null) */
    value: boolean | number | string | null;
}

/**
 * Interface representing a state output object
 * 
 * @public
 * @category States
 * @experimental
 */
export interface StateOutput extends State {
    /** Data type of the state value */
    data_type?: StateDataType | null;
}

/**
 * Response from the get_states API endpoint
 * 
 * @public
 * @category States
 * @experimental
 */
export interface GetStatesResponse {
    /** Array of state objects */
    states: StateOutput[];
}

/**
 * Response from the set_states API endpoint
 * 
 * @public
 * @category States
 * @experimental
 */
export interface SetStatesResponse {
    /** Optional error message */
    error?: string;
}
