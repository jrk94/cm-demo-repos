
export const TEMPLATE_INTELLISENSE_DATA_STORE: string = `
/** Access to temporary and persisted data store */
export interface DataStore {
    /**
     * Store data to be used within the workflows
     * @param identifier Unique identifier of the data
     * @param data Data to store
     * @param location Location of the data ("Temporary", "Persistent")
     * Note: Store an undefined value to delete the stored entry
     */
    store(identifier: string, data: any, location: string): Promise<void>;

    /**
     * Retrieve a previously stored data
     * @param identifier Unique identifier of the data
     * @param defaultValue Value to return if nothing was previously stored
     * returns the value stored or a default value
     */
    retrieve(identifier: string, defaultValue: any): Promise<any>;
}

`;
