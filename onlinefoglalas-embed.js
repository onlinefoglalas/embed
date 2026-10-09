/**
 * Onlinefoglalás.hu - JavaScript Embed Widget
 * Beágyazza a tenant foglalóoldalát egy iframe-ben, a tartalom magasságához igazodva.
 */

'use strict';

if (typeof window !== 'undefined' && typeof window.OnlinefoglalasEmbed === 'undefined') {
    window.__OnlinefoglalasEmbedQueue = [];
    window.OnlinefoglalasEmbed = function (config) {
        window.__OnlinefoglalasEmbedQueue.push(config);
    };
}

(function () {
    'use strict';

    var ROOT_DOMAIN = 'onlinefoglalas.hu';
    var LOCALES = ['hu', 'en', 'de'];
    var DEFAULT_HEIGHT = 700;
    var MAX_WIDTH = '1001px';
    var MESSAGE_SOURCE = 'onlinefoglalas-booking';
    var PARENT_URL_MESSAGE = 'onlinefoglalas_parent_url';
    var TITLES = {
        hu: 'Online időpontfoglalás',
        en: 'Online booking',
        de: 'Online-Terminbuchung'
    };

    function rootDomain(baseUrl) {
        try {
            var host = new URL(baseUrl).hostname.toLowerCase().replace(/^www\./, '');

            if (host === ROOT_DOMAIN || host.slice(-(ROOT_DOMAIN.length + 1)) === '.' + ROOT_DOMAIN) {
                return host;
            }
        } catch (e) {
            return ROOT_DOMAIN;
        }

        return ROOT_DOMAIN;
    }

    function fixedHeight(height) {
        var value = parseInt(height, 10);

        return String(height).trim() !== 'auto' && value > 0 ? value : null;
    }

    class OnlinefoglalasEmbed {
        constructor(config) {
            config = config || {};

            this.config = {
                container: config.container || 'onlinefoglalas-embed',
                domain: String(config.domain || '').trim().toLowerCase(),
                locale: LOCALES.indexOf(config.locale) !== -1 ? config.locale : 'hu',
                height: config.height || 'auto',
                width: config.width || '100%',
                baseUrl: config.baseUrl || 'https://' + ROOT_DOMAIN,
                onLoad: config.onLoad || null,
                onError: config.onError || null,
                onComplete: config.onComplete || null
            };

            this.container = null;
            this.iframe = null;
            this.origin = null;
            this.initialized = false;
            this.handleMessage = this.handleMessage.bind(this);

            this.init();
        }

        init() {
            if (this.initialized) {
                return;
            }

            if (typeof this.config.container === 'string') {
                this.container = document.getElementById(this.config.container);
            } else if (this.config.container instanceof HTMLElement) {
                this.container = this.config.container;
            }

            if (!this.container) {
                this.fail('Container not found');

                return;
            }

            if (!/^[a-z0-9_-]+$/.test(this.config.domain)) {
                this.fail('Domain is required');

                return;
            }

            this.origin = 'https://' + this.config.domain + '.' + rootDomain(this.config.baseUrl);

            var src = this.origin + '/' + (this.config.locale === 'hu' ? '' : this.config.locale + '/') + '?iframe=1';
            var height = fixedHeight(this.config.height) || DEFAULT_HEIGHT;
            var iframe = document.createElement('iframe');

            iframe.src = src;
            iframe.title = TITLES[this.config.locale];
            iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
            iframe.setAttribute('loading', 'eager');
            iframe.style.cssText = 'display:block;border:0;margin:0 auto;max-width:' + MAX_WIDTH + ';width:' + this.config.width + ';height:' + height + 'px;';
            iframe.addEventListener('load', () => this.sendParentUrl());

            this.container.innerHTML = '';
            this.container.appendChild(iframe);
            this.iframe = iframe;

            window.addEventListener('message', this.handleMessage);

            this.initialized = true;
        }

        sendParentUrl() {
            if (!this.iframe || !this.iframe.contentWindow) {
                return;
            }

            this.iframe.contentWindow.postMessage({ type: PARENT_URL_MESSAGE, url: window.location.href }, this.origin);
        }

        handleMessage(event) {
            if (!this.iframe || event.source !== this.iframe.contentWindow || event.origin !== this.origin) {
                return;
            }

            var data = event.data;

            if (!data || data.source !== MESSAGE_SOURCE) {
                return;
            }

            if (data.type === 'booking:height' && fixedHeight(this.config.height) === null && data.height > 0) {
                this.iframe.style.height = Math.ceil(data.height) + 'px';
            } else if (data.type === 'booking:ready' && typeof this.config.onLoad === 'function') {
                this.config.onLoad();
            } else if (data.type === 'booking:completed' && typeof this.config.onComplete === 'function') {
                this.config.onComplete(data.context);
            }
        }

        fail(message) {
            console.error('OnlinefoglalasEmbed: ' + message);

            if (typeof this.config.onError === 'function') {
                this.config.onError(message);
            }
        }

        destroy() {
            window.removeEventListener('message', this.handleMessage);

            if (this.container) {
                this.container.innerHTML = '';
            }

            this.iframe = null;
            this.initialized = false;
        }

        reload() {
            this.destroy();
            this.init();
        }
    }

    window.OnlinefoglalasEmbed = OnlinefoglalasEmbed;

    if (Array.isArray(window.__OnlinefoglalasEmbedQueue) && window.__OnlinefoglalasEmbedQueue.length > 0) {
        window.__OnlinefoglalasEmbedQueue.forEach(function (queuedConfig) {
            try {
                new OnlinefoglalasEmbed(queuedConfig);
            } catch (e) {
                console.error('OnlinefoglalasEmbed: Error processing queued init', e);
            }
        });
        window.__OnlinefoglalasEmbedQueue = [];
    }

    var initEmbedElements = function () {
        document.querySelectorAll('[data-onlinefoglalas-embed]').forEach(function (element) {
            if (element.dataset.onlinefoglalasEmbedInitialized === 'true') {
                return;
            }

            new OnlinefoglalasEmbed({
                container: element,
                domain: element.getAttribute('data-domain'),
                locale: element.getAttribute('data-locale') || 'hu',
                height: element.getAttribute('data-height') || 'auto',
                width: element.getAttribute('data-width') || '100%',
                baseUrl: element.getAttribute('data-base-url') || 'https://' + ROOT_DOMAIN
            });
            element.dataset.onlinefoglalasEmbedInitialized = 'true';
        });
    };

    var mutationScheduled = false;

    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initEmbedElements);
        } else {
            initEmbedElements();
        }

        if (typeof MutationObserver !== 'undefined') {
            new MutationObserver(function (mutations) {
                var found = mutations.some(function (mutation) {
                    return Array.prototype.some.call(mutation.addedNodes, function (node) {
                        return node.nodeType === 1 && (
                            (node.hasAttribute && node.hasAttribute('data-onlinefoglalas-embed')) ||
                            (node.querySelector && node.querySelector('[data-onlinefoglalas-embed]'))
                        );
                    });
                });

                if (!found || mutationScheduled) {
                    return;
                }

                mutationScheduled = true;
                setTimeout(function () {
                    mutationScheduled = false;
                    initEmbedElements();
                }, 50);
            }).observe(document.documentElement || document.body, { childList: true, subtree: true });
        }
    } catch (e) {
        console.error('OnlinefoglalasEmbed: Auto-init error', e);
    }
})();
