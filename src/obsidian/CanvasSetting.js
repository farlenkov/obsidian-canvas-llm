import { Plugin, Modal, Notice, TextFileView, PluginSettingTab, Setting } from 'obsidian';

export default class CanvasSetting extends PluginSettingTab  
{
    constructor(app, plugin) 
    {
        super(app, plugin);
        this.plugin = plugin;
    }

    display()
    {
        let { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('Date format')
            .setDesc('Default date format')
            .addText((text) =>
                text
                .setPlaceholder('MMMM dd, yyyy')
                .setValue(this.plugin.settings.dateFormat)
                .onChange(async (value) => {
                    this.plugin.settings.dateFormat = value;
                    await this.plugin.saveSettings();
                }));
    }
}