// Import site styles and libraries
import '../src/styles/bootstrap.scss';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Import SDK from the built library
import * as PumpRoomSdk from '../src/index.ts';

const apiKey = import.meta.env.VITE_PUMPROOM_API_KEY;
const realm = import.meta.env.VITE_PUMPROOM_REALM;

const profile = {
    id: 'demo_user@inzhenerka.tech',
    name: 'demo_user',
};

PumpRoomSdk.init({
    apiKey,
    realm,
    cacheUser: true,
});

PumpRoomSdk.setOnInitCallback(async (data) => {
    console.log('[CB] Instance initialized:', data);
    console.log('[CB] All instances', PumpRoomSdk.getInstances())
});

PumpRoomSdk.setOnTaskLoadedCallback(async (data) => {
    console.log('[CB] Task loaded:', data);
});

PumpRoomSdk.setOnTaskSubmittedCallback(async (data) => {
    console.log('[CB] Task submitted:', data);
});

PumpRoomSdk.setOnResultReadyCallback(async (data) => {
    console.log('[CB] Result ready:', data);
});

// States module testing UI functionality
document.addEventListener('DOMContentLoaded', async () => {
    await PumpRoomSdk.authenticate({lms: profile});
    console.log('Authentication successful, loading states...');
    // Load states when page loads
    await loadStates();

    // Get UI elements
    const checkbox1 = document.getElementById('checkbox1') as HTMLInputElement;
    const checkbox2 = document.getElementById('checkbox2') as HTMLInputElement;
    const clearStatesBtn = document.getElementById('clearStatesBtn') as HTMLButtonElement;

    // Define state names
    const STATE_CHECKBOX1 = 'checkbox1State';
    const STATE_CHECKBOX2 = 'checkbox2State';


    // Add event listeners for checkboxes
    checkbox1.addEventListener('change', async () => {
        try {
            await PumpRoomSdk.storeStates([{
                name: STATE_CHECKBOX1,
                value: checkbox1.checked
            }]);
            console.log(`Stored state: ${STATE_CHECKBOX1} = ${checkbox1.checked}`);
        } catch (error) {
            console.error(`Error storing state: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    checkbox2.addEventListener('change', async () => {
        try {
            await PumpRoomSdk.storeStates([{
                name: STATE_CHECKBOX2,
                value: checkbox2.checked
            }]);
            console.log(`Stored state: ${STATE_CHECKBOX2} = ${checkbox2.checked}`);
        } catch (error) {
            console.error(`Error storing state: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // Add event listener for clear button
    clearStatesBtn.addEventListener('click', async () => {
        try {
            await PumpRoomSdk.clearStates([STATE_CHECKBOX1, STATE_CHECKBOX2]);
            console.log('Cleared all states');

            // Reset checkboxes
            checkbox1.checked = false;
            checkbox2.checked = false;
        } catch (error) {
            console.error(`Error clearing states: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
});

// Helper function to load states
async function loadStates() {
    try {
        const result = await PumpRoomSdk.fetchStates(['checkbox1State', 'checkbox2State']);
        console.log('Fetched states:', result);

        // Try to update UI with fetched states
        if (Array.isArray(result.states)) {
            updateCheckboxesFromStates(result.states);
        } else {
            console.error('Invalid state format received:', result);
        }
    } catch (error) {
        console.error(`Error fetching states: ${error instanceof Error ? error.message : String(error)}`);
    }
}

// Function to update checkboxes from states, with retry mechanism
function updateCheckboxesFromStates(states: Array<{
    name: string,
    value: boolean | number | string | null
}>, retryCount = 0) {
    // Get checkbox elements
    console.log('Updating checkboxes from states...');
    const checkbox1 = document.getElementById('checkbox1') as HTMLInputElement;
    const checkbox2 = document.getElementById('checkbox2') as HTMLInputElement;

    // Find states by name
    const checkbox1State = states.find(state => state.name === 'checkbox1State');
    const checkbox2State = states.find(state => state.name === 'checkbox2State');

    if (checkbox1State !== undefined) {
        checkbox1.checked = !!checkbox1State.value;
        console.log('Updated checkbox1 to:', checkbox1.checked);
    }

    if (checkbox2State !== undefined) {
        checkbox2.checked = !!checkbox2State.value;
        console.log('Updated checkbox2 to:', checkbox2.checked);
    }
}
