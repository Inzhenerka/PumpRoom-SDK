/**
 * Types for the States module
 * 
 * This file contains type definitions for the States module.
 * 
 * @module Types/States
 * @category States
 */

/**
 * Enum for state data types
 * 
 * @public
 * @category States
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
 */
export interface GetStatesResponse {
    /** Status of the operation */
    status: 'success' | 'error';
    /** Optional error message */
    error?: string;
    /** Array of state objects */
    states: StateOutput[];
}

/**
 * Response from the set_states API endpoint
 * 
 * @public
 * @category States
 */
export interface SetStatesResponse {
    /** Status of the operation */
    status: 'success' | 'error';
    /** Optional error message */
    error?: string;
}
