/**
 * Selector Picker - модуль для выбора CSS-селекторов элементов на веб-странице
 * 
 * Этот модуль позволяет открыть любую веб-страницу в модальном окне,
 * выбрать элемент на странице и получить его CSS-селектор.
 * 
 * @version 1.3.0
 * @author Tom Opencart
 * @license MIT
 */

// Создаем глобальный объект для модуля
window.SelectorPicker = window.SelectorPicker || {};

// Используем IIFE для изоляции кода
(function (SelectorPicker, $) {
    'use strict';

    /**
     * Инициализация модуля
     */
    SelectorPicker.init = function (options) {
        // Настройки по умолчанию
        var settings = $.extend({
            modalId: 'selector-picker-modal',
            iframeId: 'selector-picker-iframe',
            loaderId: 'selector-picker-loading',
            urlInputId: 'selector-picker-url',
            selectorInputId: 'selector-picker-result',
            openButtonId: 'selector-picker-open',
            modalTitle: '',
            modalSize: 'lg',
            modalWidth: '90%',
            modalHeight: '90%',
            loadingText: '',
            instructionLabel: '',
            instructionText: '',
            tooltipElementLabel: '',
            tooltipSelectorLabel: '',
            tooltipHoverHint: '',
            tooltipHoverDefault: '',
            buttonUseCurrent: '',
            buttonUseSelected: '',
            buttonCancelSelection: '',
            tooltipVisualSelection: '',
            tooltipMatches: '',
            errorMessages: {
                noUrl: '',
                jqueryNotDefined: '',
                bootstrapNotDefined: '',
                iframeNotFound: '',
                sameOriginPolicy: '',
                showModalPrefix: '',
                initPrefix: '',
                iframeScriptPrefix: ''
            }
        }, options);

        // Сохраняем настройки
        SelectorPicker.settings = settings;

        // Создаем модальное окно, если его еще нет
        if ($('#' + settings.modalId).length === 0) {
            createModal(settings);
        }

        // Настраиваем обработчики событий
        setupEventHandlers(settings);

        console.log('SelectorPicker initialized with settings:', settings);
    };

    /**
     * Создание модального окна
     */
    function createModal(settings) {
        var modalHtml =
            '<div class="modal fade" id="' + settings.modalId + '" tabindex="-1" role="dialog" aria-labelledby="' + settings.modalId + '-title">' +
            '  <div class="modal-dialog modal-' + settings.modalSize + '" role="document" style="width: ' + settings.modalWidth + '; height: ' + settings.modalHeight + ';">' +
            '    <div class="modal-content" style="height: 90vh;">' +
            '      <div class="modal-header">' +
            '        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>' +
            '        <h4 class="modal-title" id="' + settings.modalId + '-title">' + settings.modalTitle + '</h4>' +
            '      </div>' +
            '      <div class="modal-body" style="padding: 0; height: calc(100% - 120px);">' +
            '        <div id="' + settings.loaderId + '" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; z-index: 1000;">' +
            '          <i class="fa fa-spinner fa-spin fa-3x"></i>' +
            '          <p>' + settings.loadingText + '</p>' +
            '        </div>' +
            '        <iframe id="' + settings.iframeId + '" style="width: 100%; height: 100%; border: none;"></iframe>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        $('body').append(modalHtml);
        console.log('Modal created with ID:', settings.modalId);
    }

    /**
     * Настройка обработчиков событий
     */
    function setupEventHandlers(settings) {
        // Обработчик для кнопки открытия селектора
        $('#' + settings.openButtonId).off('click').on('click', function () {
            SelectorPicker.open();
        });

        // Удаляем старые обработчики сообщений
        window.removeEventListener('message', SelectorPicker.messageHandler);

        // Добавляем новый обработчик сообщений
        SelectorPicker.messageHandler = function (event) {
            if (event.data && event.data.type === 'selector') {
                var selector = event.data.selector;
                console.log('Selected element:', selector);

                // Заполняем поле с селектором
                $('#' + settings.selectorInputId).val(selector);

                // Закрываем модальное окно
                $('#' + settings.modalId).modal('hide');

                // Вызываем callback, если он определен
                if (typeof settings.onSelect === 'function') {
                    settings.onSelect(selector);
                }
            } else if (event.data && event.data.type === 'cancel') {
                // Закрываем модальное окно при отмене
                $('#' + settings.modalId).modal('hide');
            }
        };

        window.addEventListener('message', SelectorPicker.messageHandler);
    }

    /**
     * Открытие модального окна с селектором
     */
    SelectorPicker.open = function (url) {
        var settings = SelectorPicker.settings;

        console.log('SelectorPicker.open called');

        // Проверяем, доступен ли jQuery
        if (typeof $ === 'undefined') {
            console.error(settings.errorMessages.jqueryNotDefined);
            alert(settings.errorMessages.jqueryNotDefined);
            return;
        }

        // Проверяем, доступен ли Bootstrap
        if (typeof $.fn.modal === 'undefined') {
            console.error(settings.errorMessages.bootstrapNotDefined);
            alert(settings.errorMessages.bootstrapNotDefined);
            return;
        }

        // Очищаем предыдущее значение селектора
        $('#' + settings.selectorInputId).val('');

        // Если URL не передан, берем его из поля ввода
        if (!url) {
            url = $('#' + settings.urlInputId).val();
        }

        console.log('URL value:', url);

        if (!url) {
            alert(settings.errorMessages.noUrl);
            return;
        }

        // Валидация URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
            $('#' + settings.urlInputId).val(url);
            console.log('Updated URL:', url);
        }

        // Показываем модальное окно с индикатором загрузки
        $('#' + settings.iframeId).attr('src', 'about:blank');

        try {
            $('#' + settings.modalId).modal('show');
            console.log('Modal shown');

            // Загружаем iframe только после открытия модального окна
            setTimeout(function () {
                // Показываем индикатор загрузки
                $('#' + settings.loaderId).show();

                // Устанавливаем обработчик загрузки перед установкой src
                $('#' + settings.iframeId).off('load').on('load', function () {
                    console.log('Iframe loaded');
                    // Скрываем индикатор загрузки
                    $('#' + settings.loaderId).hide();
                    // Инициализируем селектор
                    SelectorPicker.initPicker();
                });

                // Устанавливаем src для iframe
                $('#' + settings.iframeId).attr('src', url);
                console.log('Set iframe src to:', url);
            }, 500);
        } catch (e) {
            console.error('Error showing modal:', e);
            alert((settings.errorMessages.showModalPrefix || '') + e.message);
        }
    };

    /**
     * Инициализация селектора в iframe
     */
    SelectorPicker.initPicker = function () {
        var settings = SelectorPicker.settings;

        try {
            console.log('Initializing selector picker...');
            var iframe = document.getElementById(settings.iframeId);

            if (!iframe) {
                console.error(settings.errorMessages.iframeNotFound);
                alert(settings.errorMessages.iframeNotFound);
                return;
            }

            var iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            var iframeWin = iframe.contentWindow;

            // Проверяем, можем ли мы получить доступ к содержимому iframe (Same-Origin Policy)
            if (!iframeDoc || !iframeWin) {
                throw new Error(settings.errorMessages.sameOriginPolicy);
            }

            // Пробуем получить доступ к body, чтобы убедиться, что у нас есть доступ
            if (!iframeDoc.body) {
                throw new Error(settings.errorMessages.sameOriginPolicy);
            }

            console.log('Successfully accessed iframe content');

            // Добавляем CSS для подсветки элементов при наведении
            var style = iframeDoc.createElement('style');
            style.textContent = '.sp-selector-hover {' +
                '    outline: 2px solid #ff9800 !important;' +
                '    background-color: rgba(255, 152, 0, 0.1) !important;' +
                '    position: relative;' +
                '    z-index: 9998;' +
                '}' +
                '' +
                '.sp-selector-fixed {' +
                '    outline: 2px solid #4caf50 !important;' +
                '    background-color: rgba(76, 175, 80, 0.1) !important;' +
                '    position: relative;' +
                '    z-index: 9998;' +
                '}' +
                '' +
                '#sp-selector-tooltip {' +
                '    position: fixed;' +
                '    top: 15px;' +
                '    right: 15px;' +
                '    background: rgba(30, 30, 30, 0.95);' +
                '    color: #fff;' +
                '    border-radius: 6px;' +
                '    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;' +
                '    font-size: 13px;' +
                '    width: 350px;' +
                '    z-index: 10000;' +
                '    box-shadow: 0 4px 15px rgba(0,0,0,0.3);' +
                '    border: 1px solid rgba(255,255,255,0.1);' +
                '    user-select: none;' +
                '}' +
                '#sp-selector-tooltip .tooltip-content { padding: 0 15px 15px; word-break: break-all; }' +
                '#sp-selector-tooltip .selector {' +
                '    font-weight: bold;' +
                '    color: #4caf50;' +
                '}' +
                '#sp-selector-tooltip .selector-value-wrap { margin-bottom: 10px; line-height: 1.4; }' +
                '#sp-selector-tooltip .element-type {' +
                '    color: #2196f3;' +
                '}' +
                '#sp-selector-tooltip .element-type-wrap { margin-bottom: 5px; }' +
                '#sp-selector-tooltip .instructions {' +
                '    margin-top: 10px;' +
                '    margin-bottom: 10px;' +
                '    font-size: 12px;' +
                '    color: #bbb;' +
                '    text-align: center;' +
                '}' +
                '#sp-selector-tooltip .btn {' +
                '    background: #4caf50;' +
                '    color: white;' +
                '    border: none;' +
                '    padding: 6px 12px;' +
                '    border-radius: 4px;' +
                '    cursor: pointer;' +
                '    font-size: 12px;' +
                '    font-weight: 500;' +
                '}' +
                '#sp-selector-tooltip .btn:hover {' +
                '    background: #388e3c;' +
                '}' +
                '#sp-drag-handle {' +
                '    cursor: grab;' +
                '    background: #222;' +
                '    padding: 8px 15px;' +
                '    border-radius: 6px 6px 0 0;' +
                '    font-size: 12px;' +
                '    font-weight: 600;' +
                '    display: flex;' +
                '    justify-content: space-between;' +
                '    border-bottom: 1px solid #444;' +
                '    margin-bottom: 10px;' +
                '    color: #ccc;' +
                '}' +
                '#sp-drag-handle:active { cursor: grabbing; }' +
                '.sp-matches { font-size: 11px; margin-left: 6px; padding: 2px 7px; border-radius: 10px; font-weight: bold; display: inline-block; vertical-align: top; }' +
                '.sp-match-single { background: rgba(76, 175, 80, 0.2); color: #4caf50; border: 1px solid #4caf50; }' +
                '.sp-match-multiple { background: rgba(255, 152, 0, 0.2); color: #ff9800; border: 1px solid #ff9800; }';
            iframeDoc.head.appendChild(style);

            // Добавляем скрипт для обработки выбора элемента
            var esc = function (value) {
                return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, ' ');
            };
            var script = iframeDoc.createElement('script');
            script.text = 'console.log("Script execution started in iframe");\n' +
                'try {\n' +
                '    var currentElement = null;\n' +
                '    var selectedElement = null;\n' +
                '    var currentSelectorData = { selector: null, matches: 0 };\n' +
                '    var selectorFixed = false;\n' +
                '    \n' +
                '    var ignoreClasses = /^(col-.*|row|container.*|grid.*|flex.*|d-.*|float-.*|w-.*|h-.*|p-.*|m-.*|active|hover|focus|disabled|hidden|show|clearfix|pull-.*|sp-selector-.*|fa|fa-.*|glyphicon.*|transition.*|carousel.*|swiper.*|owl-.*)$/i;\n' +
                '    \n' +
                '    function escapeCSS(str) {\n' +
                '        if (window.CSS && CSS.escape) return CSS.escape(str);\n' +
                '        return str.replace(/([^a-zA-Z0-9_-])/g, "\\\\$1");\n' +
                '    }\n' +
                '    \n' +
                '    function normalizeClassToken(value) {\n' +
                '        value = String(value || "").trim();\n' +
                '        while (value.charAt(0) === ".") {\n' +
                '            value = value.substring(1);\n' +
                '        }\n' +
                '        return value;\n' +
                '    }\n' +
                '    \n' +
                '    function checkUnique(selector) {\n' +
                '        try { return document.querySelectorAll(selector).length; } catch(e) { return 0; }\n' +
                '    }\n' +
                '    \n' +
                '    function getCombinations(arr) {\n' +
                '        var result = [];\n' +
                '        var limit = Math.min(arr.length, 3);\n' +
                '        var f = function(prefix, arr, depth) {\n' +
                '            for (var i = 0; i < arr.length; i++) {\n' +
                '                result.push(prefix + "." + escapeCSS(arr[i]));\n' +
                '                if (depth < limit) {\n' +
                '                    f(prefix + "." + escapeCSS(arr[i]), arr.slice(i + 1), depth + 1);\n' +
                '                }\n' +
                '            }\n' +
                '        }\n' +
                '        f("", arr, 1);\n' +
                '        return result.sort(function(a,b) { return (a.split(".").length - b.split(".").length) || (a.length - b.length); });\n' +
                '    }\n' +
                '    \n' +
                '    function buildElementSelector(el) {\n' +
                '        if (el.id) {\n' +
                '            var idSel = "#" + escapeCSS(el.id);\n' +
                '            if (checkUnique(idSel) === 1) return { selector: idSel, matches: 1 };\n' +
                '        }\n' +
                '        \n' +
                '        var tagName = el.tagName.toLowerCase();\n' +
                '        var validClasses = [];\n' +
                '        if (el.classList && el.classList.length) {\n' +
                '            for (var i = 0; i < el.classList.length; i++) {\n' +
                '                var c = normalizeClassToken(el.classList[i]);\n' +
                '                if (!ignoreClasses.test(c)) validClasses.push(c);\n' +
                '            }\n' +
                '        }\n' +
                '        \n' +
                '        if (validClasses.length > 0) {\n' +
                '            var combos = getCombinations(validClasses);\n' +
                '            for (var i=0; i<combos.length; i++) {\n' +
                '                if (checkUnique(combos[i]) === 1) return { selector: combos[i], matches: 1 };\n' +
                '            }\n' +
                '            for (var i=0; i<combos.length; i++) {\n' +
                '                if (checkUnique(tagName + combos[i]) === 1) return { selector: tagName + combos[i], matches: 1 };\n' +
                '            }\n' +
                '        }\n' +
                '        return null;\n' +
                '    }\n' +
                '    \n' +
                '    function getSelector(element) {\n' +
                '        var directRes = buildElementSelector(element);\n' +
                '        if (directRes && directRes.matches === 1) return directRes;\n' +
                '        \n' +
                '        var targetTag = element.tagName.toLowerCase();\n' +
                '        var targetClasses = "";\n' +
                '        var validTargetClasses = [];\n' +
                '        if (element.classList && element.classList.length) {\n' +
                '            for (var i = 0; i < element.classList.length; i++) {\n' +
                '                var c = normalizeClassToken(element.classList[i]);\n' +
                '                if (!ignoreClasses.test(c)) validTargetClasses.push(c);\n' +
                '            }\n' +
                '        }\n' +
                '        \n' +
                '        if (validTargetClasses.length > 0) {\n' +
                '             targetClasses = "." + validTargetClasses.map(function(c) { return escapeCSS(c); }).join(".");\n' +
                '        }\n' +
                '        var targetLocalSelector = targetTag + targetClasses;\n' +
                '        \n' +
                '        var current = element.parentElement;\n' +
                '        var level = 1;\n' +
                '        var maxLevels = 3;\n' +
                '        \n' +
                '        while (current && current.nodeType === 1 && level <= maxLevels) {\n' +
                '            var parentRes = buildElementSelector(current);\n' +
                '            if (parentRes && parentRes.matches === 1) {\n' +
                '                var looseSel = parentRes.selector + " " + targetLocalSelector;\n' +
                '                if (checkUnique(looseSel) === 1) return { selector: looseSel, matches: 1 };\n' +
                '                \n' +
                '                if (level === 1) {\n' +
                '                    var directSel = parentRes.selector + " > " + targetLocalSelector;\n' +
                '                    if (checkUnique(directSel) === 1) return { selector: directSel, matches: 1 };\n' +
                '                }\n' +
                '                \n' +
                '                return { selector: looseSel, matches: checkUnique(looseSel) };\n' +
                '            }\n' +
                '            current = current.parentElement;\n' +
                '            level++;\n' +
                '        }\n' +
                '        \n' +
                '        return { selector: targetLocalSelector, matches: checkUnique(targetLocalSelector) };\n' +
                '    }\n' +
                '    \n' +
                '    var tooltipDiv = document.createElement("div");\n' +
                '    tooltipDiv.id = "sp-selector-tooltip";\n' +
                '    tooltipDiv.innerHTML = \'<div id="sp-drag-handle">\' +\n' +
                '        \'<span><i style="margin-right:5px;opacity:0.6;">☰</i> \' + \'' + esc(settings.tooltipVisualSelection || "Визуальный выбор") + '\' + \'</span>\' +\n' +
                '        \'<span id="sp-close-btn" style="cursor:pointer;font-size:16px;line-height:1;padding:0 5px;">&times;</span></div>\' +\n' +
                '        \'<div class="tooltip-content">\' +\n' +
                '        \'<div class="element-type-wrap"><span class="element-type">\' + \'' + esc(settings.tooltipElementLabel || "Тег:") + '\' + \'</span> <span id="element-type-value">...</span></div>\' +\n' +
                '        \'<div class="selector-value-wrap"><span class="selector">\' + \'' + esc(settings.tooltipSelectorLabel || "Селектор:") + '\' + \'</span> <span id="selector-value" style="font-family:monospace;word-break:break-all;">\' + \'' + esc(settings.tooltipHoverDefault || "Наведите на элемент") + '\' + \'</span> \'+ \n' +
                '        \'<span id="match-count" class="sp-matches" style="display:none;"></span></div>\' +\n' +
                '        \'<div class="instructions" id="sp-instructions" style="text-align:left;">\' + \'' + esc(settings.tooltipHoverHint || "Наведите на элемент и кликните (ESC - отмена)") + '\' + \'</div>\' +\n' +
                '        \'<div id="sp-actions" style="display:none; text-align:right; margin-top:10px;">\' +\n' +
                '        \'<button id="cancel-selection-btn" class="btn" style="background:#f44336; margin-right: 5px;">\' + \'' + esc(settings.buttonCancelSelection || "Отменить выбор") + '\' + \'</button>\' +\n' +
                '        \'<button id="select-btn" class="btn">\' + \'' + esc(settings.buttonUseSelected || "Использовать") + '\' + \'</button>\' +\n' +
                '        \'</div>\' +\n' +
                '        \'</div>\';\n' +
                '    document.body.appendChild(tooltipDiv);\n' +
                '    \n' +
                '    var tooltipEl = document.getElementById("sp-selector-tooltip");\n' +
                '    \n' +
                '    var isDragging = false;\n' +
                '    var dragOffsetX = 0, dragOffsetY = 0;\n' +
                '    document.getElementById("sp-drag-handle").addEventListener("mousedown", function(e) {\n' +
                '        if (e.target.id === "sp-close-btn") return;\n' +
                '        isDragging = true;\n' +
                '        var rect = tooltipEl.getBoundingClientRect();\n' +
                '        dragOffsetX = e.clientX - rect.left;\n' +
                '        dragOffsetY = e.clientY - rect.top;\n' +
                '        e.preventDefault();\n' +
                '        e.stopPropagation();\n' +
                '    });\n' +
                '    document.addEventListener("mousemove", function(e) {\n' +
                '        if (!isDragging) return;\n' +
                '        var x = e.clientX - dragOffsetX;\n' +
                '        var y = e.clientY - dragOffsetY;\n' +
                '        x = Math.max(0, Math.min(x, window.innerWidth - tooltipEl.offsetWidth));\n' +
                '        y = Math.max(0, Math.min(y, window.innerHeight - tooltipEl.offsetHeight));\n' +
                '        tooltipEl.style.left = x + "px";\n' +
                '        tooltipEl.style.top = y + "px";\n' +
                '        tooltipEl.style.right = "auto";\n' +
                '        tooltipEl.style.bottom = "auto";\n' +
                '    });\n' +
                '    document.addEventListener("mouseup", function() { isDragging = false; });\n' +
                '    \n' +
                '    document.getElementById("sp-close-btn").addEventListener("click", function(e) {\n' +
                '        e.stopPropagation();\n' +
                '        window.parent.postMessage({ type: "cancel" }, "*");\n' +
                '    });\n' +
                '    \n' +
                '    document.getElementById("select-btn").addEventListener("click", function(e) {\n' +
                '        e.stopPropagation();\n' +
                '        if (currentSelectorData.selector) {\n' +
                '            window.parent.postMessage({ type: "selector", selector: currentSelectorData.selector }, "*");\n' +
                '        }\n' +
                '    });\n' +
                '    \n' +
                '    document.getElementById("cancel-selection-btn").addEventListener("click", function(e) {\n' +
                '        e.stopPropagation();\n' +
                '        selectorFixed = false;\n' +
                '        if (selectedElement) selectedElement.classList.remove("sp-selector-fixed");\n' +
                '        document.getElementById("sp-actions").style.display = "none";\n' +
                '        document.getElementById("sp-instructions").style.display = "block";\n' +
                '    });\n' +
                '    \n' +
                '    function updateTooltipUI(tagName, selData) {\n' +
                '        document.getElementById("element-type-value").textContent = tagName;\n' +
                '        document.getElementById("selector-value").textContent = selData.selector;\n' +
                '        var matchBadge = document.getElementById("match-count");\n' +
                '        matchBadge.style.display = "inline-block";\n' +
                '        matchBadge.textContent = "\' + \'' + esc(settings.tooltipMatches || "Совпадений: ") + '\' + \'" + selData.matches;\n' +
                '        matchBadge.className = "sp-matches " + (selData.matches === 1 ? "sp-match-single" : "sp-match-multiple");\n' +
                '    }\n' +
                '    \n' +
                '    document.addEventListener("keydown", function(e) {\n' +
                '        if (e.key === "Escape") window.parent.postMessage({ type: "cancel" }, "*");\n' +
                '    });\n' +
                '    \n' +
                '    document.addEventListener("mousemove", function(e) {\n' +
                '        if (selectorFixed || isDragging) return;\n' +
                '        var nextElement = document.elementFromPoint(e.clientX, e.clientY);\n' +
                '        if (!nextElement || nextElement.id === "sp-selector-tooltip" || (nextElement.closest && nextElement.closest("#sp-selector-tooltip"))) return;\n' +
                '        if (currentElement === nextElement) return;\n' +
                '        if (currentElement) currentElement.classList.remove("sp-selector-hover");\n' +
                '        currentElement = nextElement;\n' +
                '        currentSelectorData = getSelector(currentElement);\n' +
                '        currentElement.classList.add("sp-selector-hover");\n' +
                '        updateTooltipUI(currentElement.tagName.toLowerCase(), currentSelectorData);\n' +
                '    });\n' +
                '    \n' +
                '    document.addEventListener("mouseleave", function() {\n' +
                '        if (selectorFixed || !currentElement) return;\n' +
                '        currentElement.classList.remove("sp-selector-hover");\n' +
                '        currentElement = null;\n' +
                '    });\n' +
                '    \n' +
                '    document.addEventListener("click", function(e) {\n' +
                '        if (e.target.id === "sp-selector-tooltip" || e.target.closest("#sp-selector-tooltip")) return;\n' +
                '        e.preventDefault();\n' +
                '        e.stopPropagation();\n' +
                '        \n' +
                '        if (selectorFixed && selectedElement) {\n' +
                '            selectedElement.classList.remove("sp-selector-fixed");\n' +
                '        }\n' +
                '        \n' +
                '        selectedElement = e.target;\n' +
                '        currentSelectorData = getSelector(selectedElement);\n' +
                '        selectorFixed = true;\n' +
                '        \n' +
                '        if (currentElement) currentElement.classList.remove("sp-selector-hover");\n' +
                '        selectedElement.classList.add("sp-selector-fixed");\n' +
                '        \n' +
                '        updateTooltipUI(selectedElement.tagName.toLowerCase(), currentSelectorData);\n' +
                '        document.getElementById("sp-instructions").style.display = "none";\n' +
                '        document.getElementById("sp-actions").style.display = "block";\n' +
                '        \n' +
                '        return false;\n' +
                '    });\n' +
                '} catch(err) {\n' +
                '    console.error("Error in iframe script:", err);\n' +
                '    alert("\' + \'' + esc(settings.errorMessages.iframeScriptPrefix) + '\' + \'" + err.message);\n' +
                '}';

            iframeDoc.body.appendChild(script);

            console.log('Selector picker initialized');
        } catch (e) {
            console.error('Error initializing selector picker:', e);

            // Показываем сообщение об ошибке
            var errorMessage = settings.errorMessages.initPrefix || '';

            // Проверяем, является ли это ошибкой Same-Origin Policy
            if (e.message.indexOf('Same-Origin Policy') !== -1) {
                errorMessage += settings.errorMessages.sameOriginPolicy;
            } else {
                errorMessage += e.message;
            }

            alert(errorMessage);

            // Закрываем модальное окно
            $('#' + settings.modalId).modal('hide');
        }
    };

})(window.SelectorPicker, jQuery);
