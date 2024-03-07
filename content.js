// -----------------------------------------------------------------
// CONFIG (you're safe to edit this)
// -----------------------------------------------------------------
// ~ GLOBAL CONFIG
// -----------------------------------------------------------------
const MODE = 'publish_drafts'; // 'publish_drafts' / 'sort_playlist';
const DEBUG_MODE = true; // true / false, enable for more context
// -----------------------------------------------------------------
// ~ PUBLISH CONFIG
// -----------------------------------------------------------------
const MADE_FOR_KIDS = false; // true / false;
const VISIBILITY = 'Public'; // 'Public' / 'Private' / 'Unlisted'

// ADDITIONAL CONFIG
const PLAN_PUBLISH = true; // true / false
const YOUTUBE_LANGUAGE = 'ZH(TW)'; // 'RU' / 'ENG(US)' / 'ENG(UK)' / 'ZH(TW)'
const PLAN_DATE_RANGE = {
    startDate: {
        day: 21,        // If you want make it today, make sure to put correct time range or will be errors
        month: 5,
        year: 2022
    },
    endDate: {           // If random generated date would be beyond youtube limitations, the plan date would be set by default(tomorrow or today)
        day: 21,
        month: 5,
        year: 2022       // 2 YEARS maximum limit in YOUTUBE
    }
};
const PLAN_TIME_RANGE = {    //"00:00","00:15","00:30","00:45","01:00","01:15","01:30","01:45","02:00","02:15","02:30","02:45","03:00","03:15","03:30","03:45","04:00","04:15","04:30","04:45","05:00","05:15","05:30","05:45","06:00","06:15","06:30","06:45","07:00","07:15","07:30","07:45","08:00","08:15","08:30","08:45","09:00","09:15","09:30","09:45","10:00","10:15","10:30","10:45","11:00","11:15","11:30","11:45","12:00","12:15","12:30","12:45","13:00","13:15","13:30","13:45","14:00","14:15","14:30","14:45","15:00","15:15","15:30","15:45","16:00","16:15","16:30","16:45","17:00","17:15","17:30","17:45","18:00","18:15","18:30","18:45","19:00","19:15","19:30","19:45","20:00","20:15","20:30","20:45","21:00","21:15","21:30","21:45","22:00","22:15","22:30","22:45","23:00","23:15","23:30","23:45"
    startTime: '17:00',
    endTime: '19:00'
};
const PLAN_TIMEZONE = '+08'; // '-01', '+01', ... '-10', '+10', ... '+12:45', '+09:30'


// -----------------------------------------------------------------
// ~ SORT PLAYLIST CONFIG
// -----------------------------------------------------------------
const SORTING_KEY = (one, other) => {
    const numberRegex = /\d+/;
    const number = (name) => name.match(numberRegex)[0];
    if (number(one.name) === undefined || number(other.name) === undefined) {
        return one.name.localeCompare(other.name);
    }
    return number(one.name) - number(other.name);
};
// END OF CONFIG (not safe to edit stuff below)
// -----------------------------------------------------------------

// ----------------------------------
// COMMON  STUFF
// ---------------------------------
const TIMEOUT_STEP_MS = 20;
const DEFAULT_ELEMENT_TIMEOUT_MS = 10000;
const FIRST_DATE = 0;
function debugLog(...args) {
    if (!DEBUG_MODE) {
        return;
    }
    console.log(...args);
}
const sleep = (ms) => new Promise((resolve, _) => setTimeout(resolve, ms));

async function waitForElement(selector, baseEl, timeoutMs) {
    if (timeoutMs === undefined) {
        timeoutMs = DEFAULT_ELEMENT_TIMEOUT_MS;
    }
    if (baseEl === undefined) {
        baseEl = document;
    }
    let timeout = timeoutMs;
    while (timeout > 0) {
        let element = baseEl.querySelector(selector);
        if (element !== null) {
            return element;
        }
        await sleep(TIMEOUT_STEP_MS);
        timeout -= TIMEOUT_STEP_MS;
    }
    debugLog(`could not find ${selector} inside`, baseEl);
    return null;
}

function click(element) {
    const event = document.createEvent('MouseEvents');
    event.initMouseEvent('mousedown', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    element.dispatchEvent(event);
    element.click();
    // debugLog(element, 'clicked');
}

// ----------------------------------
// PUBLISH STUFF
// ----------------------------------
const VISIBILITY_PUBLISH_ORDER = {
    'Private': 0,
    'Unlisted': 1,
    'Public': 2,
};

// SELECTORS
// ---------
const VIDEO_ROW_SELECTOR = 'ytcp-video-row';
const VIDEO_TITLE = '#video-title';
const NEXT_PAGE_BOTTON = '#navigate-after';
const DRAFT_MODAL_SELECTOR = '.style-scope.ytcp-uploads-dialog';
const DRAFT_BUTTON_SELECTOR = '.edit-draft-button';
const MADE_FOR_KIDS_SELECTOR = '#made-for-kids-group';
const RADIO_BUTTON_SELECTOR = 'tp-yt-paper-radio-button';
const VISIBILITY_STEPPER_SELECTOR = '#step-badge-3';
const VISIBILITY_PAPER_BUTTONS_SELECTOR = 'tp-yt-paper-radio-group';
const SAVE_BUTTON_SELECTOR = '#done-button';
const SUCCESS_ELEMENT_SELECTOR = 'ytcp-video-thumbnail-with-info';
const DIALOG_SELECTOR = 'ytcp-dialog.ytcp-video-share-dialog > tp-yt-paper-dialog:nth-child(1)';
const DIALOG_CLOSE_BUTTON_SELECTOR = 'tp-yt-iron-icon';

const PLAN_PUBLISH_BUTTON = '#second-container-expand-button';
const PLAN_TIMEZONE_BUTTON = '#timezone-select-button';
const PLAN_DATEPICKER_BUTTON = '#datepicker-trigger';
const PLAN_TIME_BUTTON = '#time-of-day-container input';


class SuccessDialog {
    constructor(raw) {
        this.raw = raw;
    }

    async closeDialogButton() {
        return await waitForElement(DIALOG_CLOSE_BUTTON_SELECTOR, this.raw);
    }

    async close() {
        click(await this.closeDialogButton());
        await sleep(50);
        // debugLog('closed');
    }
}

class VisibilityModal {
    constructor(raw) {
        this.raw = raw;
    }

    async setStartDate(date){
        this.publishDate = new Date(date);
    }

    async setPublishAfter(i){
        this.publishDate.setDate(this.publishDate.getDate() + i);
    }

    async radioButtonGroup() {
        return await waitForElement(VISIBILITY_PAPER_BUTTONS_SELECTOR, this.raw);
    }

    async visibilityRadioButton() {
        const group = await this.radioButtonGroup();
        const value = VISIBILITY_PUBLISH_ORDER[VISIBILITY];
        return [...group.querySelectorAll(RADIO_BUTTON_SELECTOR)][value];
    }

    async setVisibility() {
        click(await this.visibilityRadioButton());
        // debugLog(`visibility set to ${VISIBILITY}`);
        await sleep(50);
    }

    async planPublishPaperButton() {
        return await waitForElement(`${PLAN_PUBLISH_BUTTON}`, this.raw);
    }
    async selectPlanPublish() {
        click(await this.planPublishPaperButton());
        await sleep(50);
        // debugLog("Plan Publish selected");
    }

    async planTimezoneButton() {
        return await waitForElement(`${PLAN_TIMEZONE_BUTTON}`, this.raw);
    }

    async planDatePickerButton() {
        return await waitForElement(`${PLAN_DATEPICKER_BUTTON}`, this.raw);
    }
    async selectPlanDatePicker() {
        click(await this.planDatePickerButton());
        await sleep(50);
        // debugLog("Plan Datepicker Btn selected");
        function formatDate(date) {
            let monthsNamesRu = ['ЯНВ.', 'ФЕВР.', 'МАР.', 'АПР.', 'МАЯ', 'ИЮН.', 'ИЮЛ.', 'АВГ.', 'СЕНТ.', 'ОКТ.', 'НОЯБ.', 'ДЕК.'];
            let monthsNamesEngUs = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            let monthsNamesEngUk = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
            let monthsNamesZhTw = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
            if (YOUTUBE_LANGUAGE === 'ENG(US)') {
                return `${monthsNamesEngUs[date.getMonth()]} ${date.getFullYear()}`
            } else if (YOUTUBE_LANGUAGE === 'ENG(UK)') {
                return `${monthsNamesEngUk[date.getMonth()]} ${date.getFullYear()}`
            } else if (YOUTUBE_LANGUAGE === 'ZH(TW)') {
                return `${monthsNamesZhTw[date.getMonth()]} ${date.getFullYear()}`
            } else {
                return `${monthsNamesRu[date.getMonth()]} ${date.getFullYear()}`
            }
        }

        const PUBLISH_DATE = this.publishDate
        let newFormattedDate = formatDate(PUBLISH_DATE);
        debugLog(`Set Date: ${PUBLISH_DATE.getDate()} ${newFormattedDate}`);

        async function scrollItems(){
            const dateItemsMonths = document.querySelectorAll('ytcp-date-picker #calendar-main .calendar-month-label');
            const filtered = Array.from(dateItemsMonths).filter(el => el.innerText.toLowerCase() === newFormattedDate.toLowerCase());
            if (document.querySelector('ytcp-date-picker #calendar-main').scrollTop < 4700) {
                if (filtered.length > 0) {
                    let parent = filtered[0].parentElement;
                    let monthDays = parent.querySelectorAll('.calendar-day');
                    let monthFilteredDays = Array.from(monthDays).filter(el => +el.innerText === PUBLISH_DATE.getDate());
                    click(monthFilteredDays[0]);
                } else {
                    document.querySelector('ytcp-date-picker #calendar-main').scrollBy(0,200);
                    await sleep(100);
                    await scrollItems()
                }
            } else {
                click(document.querySelector('tp-yt-iron-overlay-backdrop'));
                debugLog('Random date not found in youtube supported dates');
            }
        }
        await scrollItems();
    }

    async planTimeButton() {
        return await waitForElement(`${PLAN_TIME_BUTTON}`, this.raw);
    }

    async planPublish() {
        await this.selectPlanPublish();
        await this.selectPlanDatePicker();
        // await this.selectPlanTimezone();
        // await this.selectPlanTime();
    }

    async saveButton() {
        return await waitForElement(SAVE_BUTTON_SELECTOR, this.raw);
    }
    async isSaved() {
        await waitForElement(SUCCESS_ELEMENT_SELECTOR, document);
    }
    async dialog() {
        return await waitForElement(DIALOG_SELECTOR);
    }
    async save() {
        click(await this.saveButton());
        await this.isSaved();
        debugLog('saved');
        const dialogElement = await this.dialog();
        const success = new SuccessDialog(dialogElement);
        return success;
    }
}

class DraftModal {
    constructor(raw) {
        this.raw = raw;
    }

    async madeForKidsToggle() {
        return await waitForElement(MADE_FOR_KIDS_SELECTOR, this.raw);
    }

    async madeForKidsPaperButton() {
        const nthChild = MADE_FOR_KIDS ? 1 : 2;
        return await waitForElement(`${RADIO_BUTTON_SELECTOR}:nth-child(${nthChild})`, this.raw);
    }

    async selectMadeForKids() {
        click(await this.madeForKidsPaperButton());
        await sleep(50);
        // debugLog(`"Made for kids" set as ${MADE_FOR_KIDS}`);
    }

    async visibilityStepper() {
        return await waitForElement(VISIBILITY_STEPPER_SELECTOR, this.raw);
    }

    async goToVisibility() {
        // debugLog('going to Visibility');
        await sleep(50);
        click(await this.visibilityStepper());
        const visibility = new VisibilityModal(this.raw);
        await sleep(50);
        await waitForElement(VISIBILITY_PAPER_BUTTONS_SELECTOR, visibility.raw);
        return visibility;
    }
}

class VideoRow {
    constructor(raw) {
        this.raw = raw;
    }

    get editDraftButton() {
        return waitForElement(DRAFT_BUTTON_SELECTOR, this.raw, 20);
    }

    get videoTitle() {
        return this.raw.querySelector(VIDEO_TITLE).textContent;
    }

    async openDraft() {
        // debugLog('focusing draft button');
        click(await this.editDraftButton);
        return new DraftModal(await waitForElement(DRAFT_MODAL_SELECTOR));
    }
}


function allVideos() {
    return [...document.querySelectorAll(VIDEO_ROW_SELECTOR)].map((el) => new VideoRow(el));
}

async function editableVideos() {
    let editable = [];
    for (let video of allVideos()) {
        if ((await video.editDraftButton) !== null) {
            editable = [...editable, video];
        }
    }
    return editable;
}

async function publishDrafts(START_DATE, BATCH) {
    var draftVideos = 1;
    while (draftVideos > 0){
        debugLog('starting in 1000ms');
        await sleep(1000);
        const videos = await editableVideos();
        draftVideos = videos.length;
        debugLog(`found ${draftVideos} videos`);
        for (let video of videos) {
            try {
                const draft = await video.openDraft();
                // debugLog({
                //     draft
                // });
                await draft.selectMadeForKids();
                const visibility = await draft.goToVisibility();
                await visibility.setVisibility();
    
                
                var matches = video.videoTitle.match(/第(\d+)到/);
                var result = parseInt(matches[1], 10);
                var i = Math.floor(result / BATCH / 2);
                // debugLog(`publish after ${i} days`);
                if (PLAN_PUBLISH) {
                    visibility.setStartDate(START_DATE);
                    visibility.setPublishAfter(i);
                    await visibility.planPublish();
                }
    
                const dialog = await visibility.save();
                await dialog.close();
                await sleep(100);
            } catch(error) {
                debugLog(`${video.videoTitle} fail`);
            }
        }
        debugLog(`All Video in this page Done!`);
        click(await waitForElement(NEXT_PAGE_BOTTON, document, 20));
        await sleep(1000);
    }
    debugLog(`Script End`);
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'publishDrafts') {
        console.log('Received message:', request);
        publishDrafts(request.startDate, request.batch);
    }
});