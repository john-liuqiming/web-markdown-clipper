import { Request, Response } from "./message";
import { get_html_of_selection, download_content } from "./utils";
import TurndownService from "turndown";

import moment from 'moment';

type CommandHandler = (a: Request) => Response;

const turndown_service = new TurndownService();

const download_selection_as_markdown_handler: CommandHandler = (request: Request) => {
    const html = get_html_of_selection();
    const markdown = turndown_service.turndown(html);

    const now = new Date();
    const created = moment(now).format("YYYY-MM-DD HH:mm:ss");
    const content = `---
created: "${created}"
source: "${document.baseURI}"
title: "${document.title}"
---

${markdown}
`;

    const filename = `${document.title}-${moment(now).format("YYYY-MM-DD-HH-mm-ss")}`;
    download_content(filename, content);

    const response: Response = {
        failed: false,
        data: markdown
    };
    return response;
};

const commandHandlers: Map<string, CommandHandler> = new Map<string, CommandHandler>();
commandHandlers.set("download_selection_as_markdown", download_selection_as_markdown_handler);
console.info(`register for command: [download_selection_as_markdown]`);

const listenMessage = () => {
    console.log(`listen message`);
    chrome.runtime.onMessage.addListener(messageHandler);
};

const messageHandler = (
    request: Request,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: Response) => void
) => {
    console.log(`receive a command ${request.command}`);
    const handler: CommandHandler | undefined = commandHandlers.get(request.command);
    if (handler) {
        console.info(`start handler for command: [${request.command}]`);
        const result = handler(request);
        sendResponse(result);
    } else {
        console.error(`no handler for command: [${request.command}]`);
        sendResponse({
            failed: true,
            msg: `unknown command "${request.command}"`,
        });
    }
    listenMessage();
};

listenMessage();
export { };