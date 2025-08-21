import { Modal } from "obsidian";
import { mount, unmount } from 'svelte'

export default class CanvasModal extends Modal 
{
	constructor(appState, ViewClass, modalType) 
    {
		super(appState.app);
        this.appState = appState;
        this.modalType = modalType;
        this.ViewClass = ViewClass;
	}

	onOpen() 
    {
        this.containerEl.classList.add('canvas-llm');
        this.containerEl.classList.add('canvas-llm-' + this.modalType);

        this.modelView = mount(this.ViewClass, 
        { 
            target : this.contentEl,
            props : { appState : this.appState, modal : this }
        });
	}
	
	onClose() 
    {
		if (this.modelView)
		{
			unmount(this.modelView);
            delete this.modelView;
		}

        this.containerEl.classList.remove('canvas-llm');
        this.containerEl.classList.remove('canvas-llm-' + this.modalType);
		this.contentEl.empty();
	}
}