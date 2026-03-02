const { FuzzySuggestModal } = require('obsidian');

export default class FileSelectModal extends FuzzySuggestModal 
{
    constructor(app, exts, onChoose) 
    {
        super(app);
        this.exts = exts;
        this.onChoose = onChoose;
    }

    getItems() 
    {
        return this.app.vault
            .getFiles()
            .filter
            (file =>
                this.exts.includes(file.extension)
            );
    }

    getItemText(file) 
    {
        return file.path;
    }

    onChooseItem(file, event) 
    {
        this.onChoose(file);
    }
}