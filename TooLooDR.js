/**
 *  TooLooDR v1.0.2
 *  Copyright (C) 2021 Marko Zivanovic <https://markozivanovic.com>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
 class TooLooDR {
    constructor(contentElement, options) {
        let defaults = {
            defaultTooLooLevel: 2,
            textHighlighting: true,
            buttonLabels: {
                show: true,
                tooLoo1: 'tldr1',
                tooLoo2: 'tldr2',
                tooLoo3: 'tldr3',
            },
            buttonColors: {
                tooLoo1Text: '#000',
                tooLoo2Text: '#000',
                tooLoo3Text: '#000',
                tooLoo1Background: '#ffaaa7',
                tooLoo2Background: '#ffd3b4',
                tooLoo3Background: '#d5ecc2',
                activeBorderColor: '#f00',
            },
            readingTime: {
                show: true,
                wordsPerMin: 200,
                labelSeparator: '•',
                showPercentage: true,
                percentageSeparator: '•',
            },
            levelColors: {
                tooLoo1Text: '#000',
                tooLoo2Text: '#000',
                tooLoo3Text: '#000',
                tooLoo1Background: '#ffaaa7',
                tooLoo2Background: '#ffd3b4',
                tooLoo3Background: '#d5ecc2',
            },
        };

        if (typeof options === 'undefined') {
            options = {};
        }
        this.contentElement = contentElement;
        this.options = this.recursiveAssign(defaults, options);
        this.addTooLoo(this.contentElement, this.options);
        this.initiateDefaultLevel(this.options, this.contentElement);
    }

    /**
     * Parses the TooLooDR formatted contents and replaces with HTML used to
     * display the text in the TooLooDR fashion.
     *
     * @param {string} element Element containing TooLooDR formatted text
     * @param {object} options Options object
     */
    addTooLoo(element, options) {
        // replaces opening and closing tooLooDR tags with span equivalents
        // eg. [tl1] becomes <span class="tldr1">
        let tooLooOutput = document.querySelector(element).innerHTML;
       
        let tooLooText = tooLooOutput;
        
        for (let i = 1; i <= 3; i++) {
            let span = '<span class="tldr' + i + '">';
            if (options.textHighlighting) {
                span = '<span class="tldr' + i + '" ';
                switch (i) {
                    case 1:
                        span += 'style="color:' + options.levelColors.tooLoo1Text + ';';
                        span += 'background-color:' + options.levelColors.tooLoo1Background + ';">';
                        break;
                    case 2:
                        span += 'style="color:' + options.levelColors.tooLoo2Text + ';';
                        span += 'background-color:' + options.levelColors.tooLoo2Background + ';">';
                        break;
                    case 3:
                        span += 'style="color:' + options.levelColors.tooLoo3Text + ';';
                        span += 'background-color:' + options.levelColors.tooLoo3Background + ';">';
                        break;
                }
            }
            
            tooLooOutput = tooLooOutput.replace(new RegExp('\\[tl' + i + ']', 'g'), span);
            tooLooOutput = tooLooOutput.replace(new RegExp('\\[\\/tl' + i + ']', 'g'), '</span>');
        }

        let readingTimes = {};
        if (options.readingTime.show) {
            readingTimes = this.getReadingTimes(tooLooText, options.readingTime);
        }

        document.querySelector(element).innerHTML = '';
        document.querySelector(element).innerHTML = tooLooOutput;
        this.loadButtons(element, options, readingTimes);
    }

    /**
     * Calculates and eturns reading times per TooLooDR segment
     *
     * @param {string} tooLooText Preformatted TooLooDR text, with the tooLoo tags
     * @param {object} readingTimeOptions Part of the options object related to the reading time
     *
     * @returns object Object containing reading times per segment as a string
     */
    getReadingTimes(tooLooText, readingTimeOptions) {
        // 1) remove all the HTML tags from the text
        // 2) remove starting/ending spaces
        // 3) replacing multiple spaces with one space
        // 3) exclude new lines with starting spacing
        tooLooText = tooLooText.replace(/<(.|\n)*?>/g, '');
        tooLooText = tooLooText.replace(/(^\s*)|(\s*$)/gi, '');
        tooLooText = tooLooText.replace(/\s\s+/g, ' ');
        tooLooText = tooLooText.replace(/\r?\n|\r/gi, ' ');

        // looks for text pieces between [tl1], [tl2] and [tl3] opening and closing tags
        // and builds an array that we use later to calculate numnber of words
        // needed to calculate the reading time per level
        let tooLooMatches = [];
        for (let i = 1; i <= 3; i++) {
            let re = new RegExp('\\[tl' + i + ']([\\s\\S]*?)\\[\\/tl' + i + ']', 'g');
            tooLooMatches.push(tooLooText.match(re));
        }

        // accumulates number of words between tooLoo segments.
        // counting method may be off as it doesn't account
        // for situations when author leaves space between opening/closing
        let tooLooReadingTimes = [];
        tooLooMatches.forEach(function (el, index) {
            tooLooReadingTimes[index] = 0;
            if (el !== null) {
                el.forEach(function (element) {
                    // in the case of 2nd level tooLoo, we can have 3rd
                    // level tooLoo nested inside of it, so let's remove it from a match
                    // when we count the words
                    if (index == 1) {
                        element = element.replace(/\[tl3]([\s\S]*?)\[\/tl3]/g, '');
                    }
                    // before we add the words, we still have the tooLoo tags we
                    // need to remove eg. [tl1], [tl2], [/tl1], etc.
                    element = element.replace(/\[tl(.)\]/g, '');
                    element = element.replace(/\[\/tl(.)\]/g, '');
                    // also, when we got the matches, some of them will start or
                    // end with whitespace, so we need to remove it per specific match
                    // after tokenizing it, we will also have occasional multiple spaces
                    element = element.replace(/(^\s*)|(\s*$)/gi, '');
                    element = element.replace(/\s\s+/g, ' ');
                    tooLooReadingTimes[index] += element.split(' ').length;
                });
            }
        });

        // each segment word total is words inside that segment
        // minus all deeper level segments
        let tooLoo3Words = tooLooReadingTimes[2];
        let tooLoo2Words = tooLooReadingTimes[1];
        let tooLoo1Words = tooLooReadingTimes[0] - tooLooReadingTimes[1] - tooLooReadingTimes[2];
        let totalWords = tooLoo1Words + tooLoo2Words + tooLoo3Words;

        let tooLoo1SegmentLength = tooLoo1Words;
        let tooLoo1String = this.getReadingTimeString(tooLoo1SegmentLength, readingTimeOptions, totalWords);

        let tooLoo2SegmentLength = tooLoo1Words + tooLoo2Words;
        let tooLoo2String = this.getReadingTimeString(tooLoo2SegmentLength, readingTimeOptions, totalWords);

        let tooLoo3SegmentLength = tooLoo1Words + tooLoo2Words + tooLoo3Words;
        let tooLoo3String = this.getReadingTimeString(tooLoo3SegmentLength, readingTimeOptions, totalWords);

        return {
            tooLoo1: tooLoo1String,
            tooLoo2: tooLoo2String,
            tooLoo3: tooLoo3String,
        };
    }

    /**
     * Generates a reading time string
     *
     * @param {integer} segmentLength Number of words in a segment
     * @param {object} readingTimeOptions Part of the options object related to the reading time
     *
     * @returns {strign} Readin time string in seconds or minutes and seconds
     */
    getReadingTimeString(segmentLength, readingTimeOptions, totalWords) {
        // calculate the minutes and seconds of reading time example:
        // 783 words ÷ 200 = 3.915 (integer part is number of minutes)
        // 0.915 × 60 = 54.9 (decimal part multiplied by 60 gives us seconds)
        let tooLooReadingTimeMin = Math.trunc(segmentLength / readingTimeOptions.wordsPerMin);

        // when doing estimates, it's better to round up (amirite fellow devs?)
        let tooLooReadingTimeSec = Math.ceil(((segmentLength / readingTimeOptions.wordsPerMin) % 1) * 60);

        let tooLooString = '';
        if (tooLooReadingTimeMin > 0) {
            tooLooString = String(tooLooReadingTimeMin) + ' min ' + String(tooLooReadingTimeSec) + ' sec';
        } else {
            tooLooString = String(tooLooReadingTimeSec) + ' sec';
        }

        if (readingTimeOptions.showPercentage) {
            tooLooString += ' ' + readingTimeOptions.percentageSeparator + ' ' + String(Math.trunc((segmentLength / totalWords) * 100)) + '%';
        }

        return tooLooString;
    }

    /**
     * Prepends the buttons to the tooLooDR text container or to the
     * other element if it's specified
     *
     * @param {string} element Id of the element to load the buttons in
     * @param {object} options Options object
     * @param {object} readingTimes Reading times object containing reading times for every segment
     */
    loadButtons(element, options, readingTimes) {
        let btnTooLoo1 = this.getButtonHtml(
            'tldr1',
            options.buttonColors.tooLoo1Text,
            options.buttonColors.tooLoo1Background,
            options.buttonLabels.tooLoo1,
            readingTimes.tooLoo1,
            options,
            'disabled'
        );

        let btnTooLoo2 = this.getButtonHtml(
            'tldr2',
            options.buttonColors.tooLoo2Text,
            options.buttonColors.tooLoo2Background,
            options.buttonLabels.tooLoo2,
            readingTimes.tooLoo2,
            options
        );

        let btnTooLoo3 = this.getButtonHtml(
            'tldr3',
            options.buttonColors.tooLoo3Text,
            options.buttonColors.tooLoo3Background,
            options.buttonLabels.tooLoo3,
            readingTimes.tooLoo3,
            options
        );

        let buttons = '<p class="tooloodr-buttons">' + btnTooLoo1 + btnTooLoo2 + btnTooLoo3 + '</p>';
        let buttonsNode = document.createRange().createContextualFragment(buttons);

        
        document.querySelector(element).prepend(buttonsNode);
        
    }

    /**
     * Constructs a TooLooDR button HTML
     *
     * @param {string} className Class name of the TooLooDR button
     * @param {string} btnTxtColor Button text color
     * @param {string} btnBgColor Button background color
     * @param {string} btnLabelTxt Button label text
     * @param {string} readingTime Reading time string
     * @param {object} options Options object
     * @param {string} additional Additional attributed for the button elemetn
     *
     * @returns {string} HTML string for a button
     */
    getButtonHtml(className, btnTxtColor, btnBgColor, btnLabelTxt, readingTime, options, additional = '') {
        let button = '<button ' + additional;
        button +=
            ' style="margin: 0 5px 10px 0;color:' +
            btnTxtColor +
            ';background-color:' +
            btnBgColor +
            ';border:2px solid ' +
            options.buttonColors.activeBorderColor +
            '"';
        button += ' data-tldr-class="' + className + '" class="active btn btn-' + className + '">';
        button += options.buttonLabels.show ? btnLabelTxt : '';

        if (options.readingTime.show) {
            if (options.buttonLabels.show) {
                button += ' ' + options.readingTime.labelSeparator + ' ';
            }
            button += readingTime;
        }

        button += '</button>';

        return button;
    }

    /**
     * Hides/shows text based on the options object and prepares buttons
     *
     * @param {object} options Options object
     */
    initiateDefaultLevel(options, element) {
        console.log(element);
        let hiddenLevels = [];
        let targetedSpans = null;
        switch (options.defaultTooLooLevel) {
            case 1:
                hiddenLevels.push('tldr2', 'tldr3');
                document.querySelector(element + ' > p > .btn-tldr2').classList.remove('active');
                document.querySelector(element + ' > p > .btn-tldr2').style.border = '1px solid transparent';
                document.querySelector(element + ' > p > .btn-tldr3').classList.remove('active');
                document.querySelector(element + ' > p > .btn-tldr3').style.border = '1px solid transparent';

                targetedSpans = document.querySelectorAll(element + ' .tldr2');
                for (var i = 0; i < targetedSpans.length; i++) {
                    targetedSpans[i].style.display = 'none';
                }
                targetedSpans = document.querySelectorAll(element + ' .tldr3');
                for (var i = 0; i < targetedSpans.length; i++) {
                    targetedSpans[i].style.display = 'none';
                }
                let thirdLevelButton = document.querySelector(element + ' > p > .btn-tldr3');
                thirdLevelButton.disabled = true;
                thirdLevelButton.classList.remove('active');
                break;
            case 2:
                hiddenLevels.push('tldr3');
                document.querySelector(element + ' > p > .btn-tldr3').classList.remove('active');
                document.querySelector(element + ' > p > .btn-tldr3').style.border = '1px solid transparent';

                targetedSpans = document.querySelectorAll(element +  ' .tldr3');
                for (var i = 0; i < targetedSpans.length; i++) {
                    targetedSpans[i].style.display = 'none';
                }
            case 3:
            //nothing
            default:
                break;
        }
        this.addButtonClickListeners(hiddenLevels, options, element);
    }

    /**
     * Adds click listeners to the TooLooDR buttons
     *
     * @param {array} hiddenLevels Depends on the default level shown in the beginning
     */
    addButtonClickListeners(hiddenLevels, options, element) {
        document.querySelectorAll(element + ' [class*=" btn-tldr"]').forEach(function (el) {
            el.addEventListener('click', function () {
                let tldrClass = this.dataset.tldrClass;
                // buttons are active while their segments are shown
                // when we hide the segment, we deactivate the button and push
                // it to the hiddenLevels array. by checking the values in that
                // array we know what to hide/show and how to style the buttons
                if (!hiddenLevels.includes(tldrClass)) {
                    hiddenLevels.push(tldrClass);

                    document.querySelector(element + ' > p > .btn-' + tldrClass).classList.remove('active');
                    document.querySelector(element + ' > p > .btn-' + tldrClass).style.border = '1px solid transparent';

                    let targetedSpans = document.querySelectorAll(element + ' .' + tldrClass);
                    for (var i = 0; i < targetedSpans.length; i++) {
                        targetedSpans[i].style.display = 'none';
                    }

                    // if the second segment is hidden, third level needs to be hidden
                    // automatically. we also need to keep track if third level was shown or
                    // hidden before it got changed by the second level. that way we can
                    // restore its state later
                    if ('tldr2' === tldrClass) {
                        let thirdLevelButton = document.querySelector(element + ' > p > .btn-tldr3');
                        thirdLevelButton.disabled = true;
                        thirdLevelButton.classList.remove('active');
                        thirdLevelButton.style.border = '1px solid transparent';

                        // beacause 3rd level can be outside of 2nd, we need to loop through
                        // 3rd level spans and hide them
                        let targetedSpans = document.querySelectorAll(element + ' .tldr3');
                        for (var i = 0; i < targetedSpans.length; i++) {
                            targetedSpans[i].style.display = 'none';
                        }
                    }
                } else {
                    var index = hiddenLevels.indexOf(tldrClass);
                    if (index > -1) {
                        hiddenLevels.splice(index, 1);
                    }
                    let targetedSpans = document.querySelectorAll(element + ' .' + tldrClass);
                    for (var i = 0; i < targetedSpans.length; i++) {
                        targetedSpans[i].style.display = 'inline';
                    }
                    document.querySelector(element + ' > p > .btn-' + tldrClass).classList.add('active');
                    document.querySelector(element + ' > p > .btn-' + tldrClass).style.border = '2px solid ' + options.buttonColors.activeBorderColor;
                    if ('tldr2' === tldrClass) {
                        let thirdLevelButton = document.querySelector(element + ' > p > .btn-tldr3');
                        thirdLevelButton.disabled = false;
                        if (!hiddenLevels.includes('tldr3')) {
                            thirdLevelButton.classList.add('active');
                            thirdLevelButton.style.border = '2px solid ' + options.buttonColors.activeBorderColor;
                            // beacause 3rd level can be outside of 2nd, we need to loop through
                            // 3rd level spans and show them
                            let targetedSpans = document.querySelectorAll(element + ' .tldr3');
                            for (var i = 0; i < targetedSpans.length; i++) {
                                targetedSpans[i].style.display = 'inline';
                            }
                        }
                    }
                }
            });
        });
    }

    /**
     *
     * Little helper function to help merge options object
     *
     * @param {object} a
     * @param {object} b
     * @returns object
     */
    recursiveAssign(a, b) {
        if (Object(b) !== b) return b;
        if (Object(a) !== a) a = {};
        for (let key in b) {
            a[key] = this.recursiveAssign(a[key], b[key]);
        }
        return a;
    }
}