import NodeState from '../Common/NodeState.svelte.js';
import TextReader from './Reader/Text.js';
import FolderReader from './Reader/Folder.js';
import TelegramReader from './Reader/Telegram.js';
import CanvasReader from './Reader/Canvas.js';
import CanvasLLMReader from './Reader/CanvasLLM.js';
import DocxReader from './Reader/DOCX.js';
import EpubReader from './Reader/EPUB.js';
import PdfReader from './Reader/PDF.js';
import Md3Reader from './Reader/MD3.js';

export default class FileInputNodeState extends NodeState
{
    constructor(id, graph)
    {
        super(id, graph);

        this.fileReaders = 
        {
            'fountain'      : new TextReader("screenplay", this),
            'md'            : new TextReader("note", this),
            'xml'           : new TextReader("file", this),
            'html'          : new TextReader("file", this),
            'json'          : new TextReader("file", this),
            'canvas-llm'    : new CanvasLLMReader(this),
            'telegram'      : new TelegramReader(this),
            'canvas'        : new CanvasReader(this),
            'folder'        : new FolderReader(this),
            'docx'          : new DocxReader(this),
            // 'epub'       : new EpubReader(this),
            // 'pdf'        : new PdfReader(this),
            'md3'           : new Md3Reader(this)
        };

        this.targetName = $state();
        this.targetPath = $state();
        this.exclude = $state();
        this.preview = $state([]);
        this.isFolder = $state(false);
        this.isNotFound = $state(false);
        this.openedFiles = {};
        this.supportedExtensions = Object.keys(this.fileReaders);

        // this.graph.plugin.onFileModify.on(this.onFileModify);
        // this.graph.plugin.onFileRename.on(this.onFileRename);
    }

    async init(data)
    {
        super.init(data);
        
        this.targetName = data.name;
        this.targetPath = data.path;
        this.exclude = data.exclude || [];

        // console.log("init > read", data.path);
        const text = await this.read(this.targetPath);

        if (!text)
            this.preview = [];
        else
            this.parsePlaceholders(text);
    }

    destroy()
    {
        // this.graph.plugin.onFileModify.off(this.onFileModify);
        // this.graph.plugin.onFileRename.off(this.onFileRename);
    }

    onFileModify(file)
    {
        // console.log("onFileModify", this);
    }

    onFileRename(files)
    {
        // console.log("onFileRename", this);
    }

    async read(path, tabs)
    {
        const file = this.app.vault.getAbstractFileByPath(path);

        if (!file)
            return null;

        if (this.openedFiles[path])
            return;

        const reader = this.fileReaders[file.extension || 'folder'];

        if (!reader)
            return "";

        const preview = [];
        tabs = tabs ? tabs : "";

        this.openedFiles[path] = true;
        const text = await reader.read(file, tabs, preview);
        delete this.openedFiles[path];
        
        if (!tabs)
        {
            this.preview = preview;
            this.isFolder = file.extension ? false : true;
        }

        // console.log("[read]", "preview:", this.preview, "text:", text);
        return text;
    }
}