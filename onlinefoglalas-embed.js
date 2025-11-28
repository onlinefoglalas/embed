/**
 * Onlinefoglalás.hu - JavaScript Embed Widget
 * This script allows embedding tenant booking pages without iframes
 */

'use strict';

// Provide an early placeholder to avoid ReferenceError if someone calls OnlinefoglalasEmbed
// before this file finishes evaluating (e.g. async load order or inline calls)
if (typeof window !== 'undefined' && typeof window.OnlinefoglalasEmbed === 'undefined') {
    window.__OnlinefoglalasEmbedQueue = [];
    window.OnlinefoglalasEmbed = function(config) {
        window.__OnlinefoglalasEmbedQueue.push(config);
    };
}

(function() {
    'use strict';

    class OnlinefoglalasEmbed {
        constructor(config) {
            
            this.config = {
                container: config.container || 'onlinefoglalas-embed',
                domain: config.domain || '',
                locale: config.locale || 'hu',
                height: config.height || 'auto',
                width: config.width || '100%',
                baseUrl: config.baseUrl || 'https://onlinefoglalas.hu',
                credentials: config.credentials !== undefined ? config.credentials : true,
                useShadowDOM: config.useShadowDOM !== undefined ? config.useShadowDOM : false,
                cssIsolation: config.cssIsolation !== undefined ? config.cssIsolation : false,
                onLoad: config.onLoad || null,
                onError: config.onError || null
            };
            

            this.container = null;
            this.shadowRoot = null;
            this.initialized = false;
            
            this.init();
        }

        init() {
            
            if (this.initialized) {
                return;
            }

            // Get container element
            if (typeof this.config.container === 'string') {
                this.container = document.getElementById(this.config.container);
            } else if (this.config.container instanceof HTMLElement) {
                this.container = this.config.container;
            }

            if (!this.container) {
                if (this.config.onError) {
                    this.config.onError('Container not found');
                }
                return;
            }
            

            if (!this.config.domain) {
                console.error('OnlinefoglalasEmbed: Domain is required');
                if (this.config.onError) {
                    this.config.onError('Domain is required');
                }
                return;
            }
            

            // Setup CSS isolation wrapper
            if (this.config.cssIsolation) {
                this.setupCSSIsolation();
            }
            
            // Add loading indicator
            this.showLoading();

            // Load content
            this.loadContent();

            this.initialized = true;
        }
        
        setupCSSIsolation() {
            // Add a wrapper div with unique class for CSS scoping
            const wrapper = document.createElement('div');
            wrapper.className = 'onlinefoglalas-embed-isolation-wrapper';
            wrapper.style.cssText = 'all: initial; display: block; width: 100%; max-width: 1001px; margin: 0 auto;';
            
            // Move container inside wrapper
            this.container.appendChild(wrapper);
            this.container = wrapper;
        }

        showLoading() {
            this.container.innerHTML = '<div class="onlinefoglalas-embed-loading" style="all: initial; display: block; text-align: center; padding: 40px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif;"><div class="onlinefoglalas-spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #37D0C2; border-radius: 50%; width: 40px; height: 40px; animation: onlinefoglalas-spin 1s linear infinite; margin: 0 auto;"></div><p style="margin-top: 15px; color: #666; font-size: 14px;">Betöltés...</p></div>';
            
            // Add spinner animation with scoped name
            if (!document.getElementById('onlinefoglalas-embed-styles')) {
                const style = document.createElement('style');
                style.id = 'onlinefoglalas-embed-styles';
                style.textContent = `
                    /* Scoped animations with prefix */
                    @keyframes onlinefoglalas-spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    /* Isolation wrapper - reset everything */
                    .onlinefoglalas-embed-isolation-wrapper {
                        all: initial;
                        display: block !important;
                        width: 100% !important;
                        max-width: 1001px !important;
                        margin: 0 auto !important;
                        box-sizing: border-box !important;
                    }
                    
                    /* Wrapper with scoped styles */
                    .onlinefoglalas-embed-wrapper {
                        all: initial;
                        display: block !important;
                        width: 100% !important;
                        max-width: 1001px !important;
                        margin: 0 auto !important;
                        box-sizing: border-box !important;
                    }
                    
                    /* Error messages with scoped styles */
                    .onlinefoglalas-embed-error {
                        all: initial;
                        display: block !important;
                        background-color: #ffebee !important;
                        color: #c62828 !important;
                        padding: 20px !important;
                        border-radius: 4px !important;
                        border-left: 4px solid #c62828 !important;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                        font-size: 14px !important;
                        line-height: 1.5 !important;
                        box-sizing: border-box !important;
                    }
                    
                    /* Protect embedded content from external CSS */
                    .onlinefoglalas-embed-wrapper * {
                        box-sizing: border-box !important;
                    }
                `;
                document.head.appendChild(style);
            }
        }

        showError(message) {
            this.container.innerHTML = `
                <div class="onlinefoglalas-embed-error">
                    <strong>Hiba:</strong> ${message}
                </div>
            `;
            
            if (this.config.onError) {
                this.config.onError(message);
            }
        }

        buildUrl() {
            let url = this.config.baseUrl;
            
            
            // Add locale prefix if not Hungarian
            if (this.config.locale && this.config.locale !== 'hu') {
                url += '/' + this.config.locale;
            }
            
            // Add domain
            url += '/' + this.config.domain;
            
            // Add embed parameter
            url += '?embed=1';
            
            return url;
        }

        async loadContent() {
            
            try {
                const url = this.buildUrl();
                
                const fetchOptions = {
                    method: 'GET',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    cache: 'no-store' // Bypass Cloudflare cache for initial load
                };
                
                // Only include credentials if enabled (needed for session/cookies)
                if (this.config.credentials) {
                    fetchOptions.credentials = 'include';
                } else {
                }
                
                const fetchStartTime = performance.now();
                const response = await fetch(url, fetchOptions);
                const fetchEndTime = performance.now();

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const html = await response.text();
                
                // Create wrapper
                const wrapper = document.createElement('div');
                wrapper.className = 'onlinefoglalas-embed-wrapper';
                
                if (this.config.height !== 'auto') {
                    wrapper.style.height = this.config.height + 'px';
                    wrapper.style.overflowY = 'auto';
                }
                
                wrapper.innerHTML = html;
                
                // Clear loading and insert content
                this.container.innerHTML = '';
                this.container.appendChild(wrapper);

                // Extract and inject styles first (they can load async)
                this.injectStyles(wrapper);
                
                // Execute scripts in order (await to ensure proper sequence)
                await this.executeScripts(wrapper);

                // Wait for step scripts to register their hooks before initialization
                // This is critical for embed mode where scripts load asynchronously
                await this.waitForStepScripts(wrapper);

                // Ensure booking panel is initialized
                // The inline script #0 tries to initialize, but it might run before booknetic.js loads
                await this.ensureBookingPanelInitialized(wrapper);

                // Setup window communication
                this.setupCommunication();

                // Auto-resize if needed
                if (this.config.height === 'auto') {
                    this.setupAutoResize(wrapper);
                }

                if (this.config.onLoad) {
                    this.config.onLoad();
                }

            } catch (error) {
                console.error('OnlinefoglalasEmbed: Error loading content', error);
                console.error('OnlinefoglalasEmbed: Error stack:', error.stack);
                this.showError('Nem sikerült betölteni a tartalmat. Kérjük, próbálja újra később.');
            }
        }

        async executeScripts(container) {
            const scripts = Array.from(container.querySelectorAll('script'));
            const externals = [];
            const inlineConfig = [];
            const inlineInit = [];
            const inlineOther = [];

            // Bucket scripts while preserving their relative order inside each bucket
            scripts.forEach((script, idx) => {
                if (script.src) {
                    externals.push({ script, idx });
                    return;
                }

                const text = script.textContent || '';
                const isInit = /bookneticInitBookingPage|initBookingPanel/i.test(text);
                const isConfig = /(BookneticData|BookneticConversionTrackingData|servicesWithCustomDuration|current_locale|window\.bookneticHooks)/i.test(text);

                if (isInit) {
                    inlineInit.push({ script, idx });
                } else if (isConfig) {
                    inlineConfig.push({ script, idx });
                } else {
                    inlineOther.push({ script, idx });
                }
            });

            // Run config inlines first (they define globals expected by externals)
            for (const item of inlineConfig) {
                await this.loadScript(item.script, item.idx);
            }

            // Run all external scripts in order (booknetic.js and deps)
            for (const item of externals) {
                await this.loadScript(item.script, item.idx);
            }

            // Then other inline helpers
            for (const item of inlineOther) {
                await this.loadScript(item.script, item.idx);
            }

            // Finally, run inline init scripts (they rely on everything above)
            for (const item of inlineInit) {
                await this.loadScript(item.script, item.idx);
            }

        }
        
        loadScript(oldScript, index) {
            return new Promise((resolve, reject) => {
                const newScript = document.createElement('script');
                const type = (oldScript.type || '').trim();
                const isModule = type === 'module';
                const isClassic = type === '' || type === 'text/javascript' || type === 'application/javascript';
                const isExecutable = isClassic || isModule;

                if (!isExecutable) {
                    // Keep the script in place so templates/data remain available
                    return resolve();
                }
                
                // Copy all attributes
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                
                if (oldScript.src) {
                    // External script - wait for it to load
                    
                    newScript.onload = () => {
                        resolve();
                    };
                    newScript.onerror = () => {
                        console.warn(`OnlinefoglalasEmbed: Failed to load script #${index}:`, oldScript.src);
                        resolve(); // Continue even if one script fails
                    };
                    
                    // Replace the old script and set src (this triggers loading)
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                    newScript.src = oldScript.src;
                } else {
                    // Inline script - execute immediately
                    const scriptPreview = oldScript.textContent.substring(0, 100).replace(/\n/g, ' ');
                    
                    newScript.textContent = oldScript.textContent;
                    
                    // Replace the old script with the new one
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                    
                    
                    // Inline scripts execute synchronously, but give them a tick to complete
                    setTimeout(resolve, 0);
                }
            });
        }

        async waitForStepScripts(wrapper) {
            // Wait for step scripts to register their hooks
            // Step scripts register hooks like 'before_step_loading' for each step
            // This is critical in embed mode where scripts load asynchronously
            const maxWaitTime = 3000; // Maximum 3 seconds
            const checkInterval = 50; // Check every 50ms
            const startTime = Date.now();
            
            return new Promise((resolve) => {
                const checkHooks = () => {
                    const elapsed = Date.now() - startTime;
                    
                    // Check if bookneticHooks is available
                    if (typeof window.bookneticHooks === 'undefined') {
                        if (elapsed < maxWaitTime) {
                            setTimeout(checkHooks, checkInterval);
                        } else {
                            console.warn('OnlinefoglalasEmbed: Timeout waiting for bookneticHooks');
                            resolve();
                        }
                        return;
                    }
                    
                    // Check if hooks are registered
                    const hooks = window.bookneticHooks.hooks || {};
                    const beforeStepLoadingHooks = hooks['before_step_loading'] || {};
                    const registeredHooks = Object.keys(beforeStepLoadingHooks).length;
                    
                    
                    // If we have hooks registered, or if we've waited at least 500ms, proceed
                    // The 500ms gives step scripts time to load and register even if they're still loading
                    if (registeredHooks > 0 || elapsed >= 500) {
                        resolve();
                    } else if (elapsed < maxWaitTime) {
                        setTimeout(checkHooks, checkInterval);
                    } else {
                        console.warn('OnlinefoglalasEmbed: Timeout waiting for step scripts, proceeding anyway...');
                        resolve();
                    }
                };
                
                // Start checking after a short delay to allow scripts to execute
                setTimeout(checkHooks, 100);
            });
        }

        async ensureBookingPanelInitialized(wrapper) {
            // Ensure that bookneticInitBookingPage is called
            // The inline script #0 tries to initialize, but it might run before booknetic.js loads
            const maxWaitTime = 2000; // Maximum 2 seconds
            const checkInterval = 50; // Check every 50ms
            const startTime = Date.now();
            
            return new Promise((resolve) => {
                const checkAndInit = () => {
                    const elapsed = Date.now() - startTime;
                    
                    // Check if bookneticInitBookingPage is available
                    if (typeof window.bookneticInitBookingPage === 'undefined') {
                        if (elapsed < maxWaitTime) {
                            setTimeout(checkAndInit, checkInterval);
                        } else {
                            console.warn('OnlinefoglalasEmbed: Timeout waiting for bookneticInitBookingPage');
                            resolve();
                        }
                        return;
                    }
                    
                    // Check if jQuery is available
                    if (typeof jQuery === 'undefined') {
                        if (elapsed < maxWaitTime) {
                            setTimeout(checkAndInit, checkInterval);
                        } else {
                            console.warn('OnlinefoglalasEmbed: Timeout waiting for jQuery');
                            resolve();
                        }
                        return;
                    }
                    
                    // Find all booking panels in the wrapper
                    const bookingPanels = wrapper.querySelectorAll('.booknetic_appointment');
                    
                    if (bookingPanels.length === 0) {
                        resolve();
                        return;
                    }
                    
                    // Check if panels are already initialized
                    let allInitialized = true;
                    bookingPanels.forEach(panel => {
                        const $panel = jQuery(panel);
                        const isInitialized = $panel.data('booknetic_has_been_initiated') === true;
                        if (!isInitialized) {
                            allInitialized = false;
                            // Manually initialize the booking panel
                            try {
                                window.bookneticInitBookingPage(panel);
                            } catch (e) {
                                console.error('OnlinefoglalasEmbed: Error initializing booking panel:', e);
                            }
                        }
                    });
                    
                    resolve();
                };
                
                // Start checking after a short delay to allow scripts to execute
                setTimeout(checkAndInit, 100);
            });
        }

        injectStyles(container) {
            const styles = container.querySelectorAll('link[rel="stylesheet"], style');
            styles.forEach(style => {
                if (!document.head.contains(style)) {
                    const clone = style.cloneNode(true);
                    document.head.appendChild(clone);
                }
            });
        }

        setupCommunication() {
            // Setup postMessage communication for cross-origin scenarios
            window.addEventListener('message', (event) => {
                // Validate origin if needed
                if (event.data && event.data.type === 'onlinefoglalas-embed') {
                    this.handleMessage(event.data);
                }
            });
        }

        handleMessage(data) {
            switch (data.action) {
                case 'resize':
                    if (data.height) {
                        this.container.style.height = data.height + 'px';
                    }
                    break;
                case 'navigate':
                    if (data.url) {
                        window.location.href = data.url;
                    }
                    break;
            }
        }

        setupAutoResize(wrapper) {
            // Use ResizeObserver if available
            if (typeof ResizeObserver !== 'undefined') {
                const resizeObserver = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        const height = entry.contentRect.height;
                        this.container.style.height = height + 'px';
                    }
                });
                
                resizeObserver.observe(wrapper);
            } else {
                // Fallback: periodic check
                setInterval(() => {
                    const height = wrapper.scrollHeight;
                    if (height > 0) {
                        this.container.style.height = height + 'px';
                    }
                }, 500);
            }
        }

        destroy() {
            if (this.container) {
                this.container.innerHTML = '';
            }
            this.initialized = false;
        }

        reload() {
            this.destroy();
            this.init();
        }
    }

    // Expose to global scope as early as possible so consumers don't hit ReferenceError
    window.OnlinefoglalasEmbed = OnlinefoglalasEmbed;

    // Drain any queued calls that happened before the real class was ready
    if (Array.isArray(window.__OnlinefoglalasEmbedQueue) && window.__OnlinefoglalasEmbedQueue.length > 0) {
        window.__OnlinefoglalasEmbedQueue.forEach((queuedConfig) => {
            try {
                new OnlinefoglalasEmbed(queuedConfig);
            } catch (e) {
                console.error('OnlinefoglalasEmbed: Error processing queued init', e);
            }
        });
        window.__OnlinefoglalasEmbedQueue = [];
    }

    // Auto-initialize from data attributes
    const initEmbedElements = function(trigger) {

        const embedElements = document.querySelectorAll('[data-onlinefoglalas-embed]');
        
        embedElements.forEach((element, index) => {
            // Avoid initializing the same element multiple times
            if (element.dataset.onlinefoglalasEmbedInitialized === 'true') {
                return;
            }
            
            const credentialsAttr = element.getAttribute('data-credentials');
            const credentials = credentialsAttr === 'false' ? false : true;
            
            const config = {
                container: element,
                domain: element.getAttribute('data-domain'),
                locale: element.getAttribute('data-locale') || 'hu',
                height: element.getAttribute('data-height') || 'auto',
                width: element.getAttribute('data-width') || '100%',
                baseUrl: element.getAttribute('data-base-url') || window.location.origin,
                credentials: credentials
            };
            
            new OnlinefoglalasEmbed(config);
            element.dataset.onlinefoglalasEmbedInitialized = 'true';
        });
    };

    let mutationScheduled = false;

    try {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => initEmbedElements('DOMContentLoaded'));
        } else {
            // DOMContentLoaded already fired (e.g. script loaded after DOM ready) – run immediately
            initEmbedElements('immediate');
        }

        // Observe for dynamically added embed elements (e.g. SPA / late render)
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver((mutations) => {
                // Only react if mutations might contain the data attribute
                let hasPotentialEmbed = false;
                for (const mutation of mutations) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) {
                            if (node.hasAttribute && node.hasAttribute('data-onlinefoglalas-embed')) {
                                hasPotentialEmbed = true;
                                break;
                            }
                            if (node.querySelector && node.querySelector('[data-onlinefoglalas-embed]')) {
                                hasPotentialEmbed = true;
                                break;
                            }
                        }
                    }
                    if (hasPotentialEmbed) break;
                }

                if (!hasPotentialEmbed) {
                    return;
                }

                // Debounce to avoid log spam when many nodes are added
                if (!mutationScheduled) {
                    mutationScheduled = true;
                    setTimeout(() => {
                        mutationScheduled = false;
                        initEmbedElements('mutation');
                    }, 50);
                }
            });
            observer.observe(document.documentElement || document.body, { childList: true, subtree: true });
        }
    } catch (e) {
        console.error('OnlinefoglalasEmbed: Auto-init error', e);
    }

})();
