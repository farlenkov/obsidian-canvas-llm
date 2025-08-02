import showdown from 'showdown'; 

// https://github.com/showdownjs/showdown

const showdownConverter = new showdown.Converter
({
    tables : true,
    tasklists : true
});

export function mdToHtml(markdown)
{
    return showdownConverter.makeHtml(markdown);
}