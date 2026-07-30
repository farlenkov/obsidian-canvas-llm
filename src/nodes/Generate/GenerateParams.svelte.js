import Modal from '$lib/svelte-obsidian/src/Modal.js';
import GenerateParamsView from '$lib/nodes/Generate/GenerateParams.svelte';

// export default class GenerateParams
// {
//     FilterName = $state("");
//     FilterFree = $state(false);

//     constructor(viewState)
//     {
//         this.viewState = viewState;
//     }

//     Show (nodeState) 
//     {
//         this.viewState.modelSelectState.ModelID = 
//             nodeState.modelId || 
//             this.viewState.settings.Data.defaultModel;
        
//         this.viewState.modelSelectState.ProviderID = 
//             nodeState.providerId || 
//             this.viewState.settings.Data.defaultProvider;

//         new Modal(
//             GenerateParamsView, 
//             {
//                 viewState : this.viewState,
//                 nodeState : nodeState
//             }, 
//             [
//                 "svelte-obsidian", 
//                 "canvas-llm", 
//                 "svelte-llm-model-select-container"
//             ])
//             .open();
//     }
// }