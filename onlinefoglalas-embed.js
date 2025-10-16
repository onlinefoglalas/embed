/**
 * Onlinefoglalás.hu - JavaScript Embed Widget
 * This script allows embedding tenant booking pages without iframes
 */

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
                useShadowDOM: config.useShadowDOM !== undefined ? config.useShadowDOM : true,
                cssIsolation: config.cssIsolation !== undefined ? config.cssIsolation : true,
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
                console.error('OnlinefoglalasEmbed: Container not found');
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
                    }
                };
                
                // Only include credentials if enabled (needed for session/cookies)
                if (this.config.credentials) {
                    fetchOptions.credentials = 'include';
                }
                
                const response = await fetch(url, fetchOptions);

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
                this.showError('Nem sikerült betölteni a tartalmat. Kérjük, próbálja újra később.');
            }
        }

        async executeScripts(container) {
            const scripts = container.querySelectorAll('script');
            
            // Execute scripts sequentially to maintain proper order
            for (let i = 0; i < scripts.length; i++) {
                const oldScript = scripts[i];
                await this.loadScript(oldScript);
            }
        }
        
        loadScript(oldScript) {
            return new Promise((resolve, reject) => {
                const newScript = document.createElement('script');
                
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
                        console.warn('Failed to load script:', oldScript.src);
                        resolve(); // Continue even if one script fails
                    };
                    
                    // Replace the old script and set src (this triggers loading)
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                    newScript.src = oldScript.src;
                } else {
                    // Inline script - execute immediately
                    newScript.textContent = oldScript.textContent;
                    
                    // Replace the old script with the new one
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                    
                    // Inline scripts execute synchronously, but give them a tick to complete
                    setTimeout(resolve, 0);
                }
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

    // Expose to global scope
    window.OnlinefoglalasEmbed = OnlinefoglalasEmbed;

    // Auto-initialize from data attributes
    document.addEventListener('DOMContentLoaded', function() {
        const embedElements = document.querySelectorAll('[data-onlinefoglalas-embed]');
        
        embedElements.forEach(element => {
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
        });
    });

})();

