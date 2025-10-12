// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            
            // Animate hamburger icon
            const spans = this.querySelectorAll('span');
            spans[0].style.transform = navLinks.classList.contains('active') ? 
                'rotate(-45deg) translate(-5px, 6px)' : 'none';
            spans[1].style.opacity = navLinks.classList.contains('active') ? '0' : '1';
            spans[2].style.transform = navLinks.classList.contains('active') ? 
                'rotate(45deg) translate(-5px, -6px)' : 'none';
        });
    }

    // Close mobile menu when clicking on a link
    const navLinkItems = document.querySelectorAll('.nav-links a');
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                const spans = mobileMenuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        observer.observe(card);
    });

    // Observe use case cards
    const useCases = document.querySelectorAll('.use-case');
    useCases.forEach((useCase, index) => {
        useCase.style.opacity = '0';
        useCase.style.transform = 'translateY(30px)';
        useCase.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        observer.observe(useCase);
    });

    // Observe installation methods
    const installMethods = document.querySelectorAll('.install-method');
    installMethods.forEach((method, index) => {
        method.style.opacity = '0';
        method.style.transform = 'translateY(30px)';
        method.style.transition = `opacity 0.6s ease-out ${index * 0.2}s, transform 0.6s ease-out ${index * 0.2}s`;
        observer.observe(method);
    });

    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll <= 0) {
            navbar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        } else {
            navbar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }

        // Optional: Hide navbar on scroll down, show on scroll up
        // if (currentScroll > lastScroll && currentScroll > 100) {
        //     navbar.style.transform = 'translateY(-100%)';
        // } else {
        //     navbar.style.transform = 'translateY(0)';
        // }

        lastScroll = currentScroll;
    });

    // Add loading effect for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        
        // Set initial opacity
        if (!img.complete) {
            img.style.opacity = '0';
            img.style.transition = 'opacity 0.3s ease-in';
        }
    });

    // Parallax effect disabled to prevent section overlapping

    // Copy code snippets functionality (if needed in future)
    const codeBlocks = document.querySelectorAll('code');
    codeBlocks.forEach(code => {
        code.style.cursor = 'pointer';
        code.title = 'Click to copy';
        
        code.addEventListener('click', function() {
            const text = this.textContent;
            navigator.clipboard.writeText(text).then(() => {
                // Show temporary tooltip
                const tooltip = document.createElement('span');
                tooltip.textContent = 'Copied!';
                tooltip.style.cssText = `
                    position: absolute;
                    background: #007acc;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    margin-left: 10px;
                    animation: fadeOut 2s forwards;
                `;
                
                this.parentElement.style.position = 'relative';
                this.parentElement.appendChild(tooltip);
                
                setTimeout(() => tooltip.remove(), 2000);
            });
        });
    });

    // Add CSS for fadeOut animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeOut {
            0% { opacity: 1; transform: translateY(0); }
            70% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
        }
    `;
    document.head.appendChild(style);

    // Fetch extension statistics from both VS Code Marketplace and Open VSX
    async function fetchExtensionStats() {
        const extensionId = 'noorashuvo.simple-coding-time-tracker';
        const cacheKey = 'extension_stats_cache';
        const cacheExpiry = 5 * 60 * 1000; // 5 minutes
        
        try {
            // Check cache first
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < cacheExpiry) {
                    updateStatsDisplay(data);
                    return;
                }
            }

            // Fetch from both APIs concurrently
            const [vsCodeData, openVsxData] = await Promise.allSettled([
                fetchVSCodeStats(extensionId),
                fetchOpenVsxStats(extensionId)
            ]);

            let vsCodeStats = { downloads: 0, installs: 0, rating: 0, ratingCount: 0 };
            let openVsxStats = { downloads: 0, installs: 0, rating: 0, ratingCount: 0 };

            if (vsCodeData.status === 'fulfilled') {
                vsCodeStats = vsCodeData.value;
            }

            if (openVsxData.status === 'fulfilled') {
                openVsxStats = openVsxData.value;
            }

            // Combine stats from both platforms
            const combinedStats = {
                downloads: vsCodeStats.downloads + openVsxStats.downloads,
                installs: vsCodeStats.installs + openVsxStats.installs,
                rating: vsCodeStats.rating || openVsxStats.rating || 0,
                ratingCount: vsCodeStats.ratingCount + openVsxStats.ratingCount
            };

            // Calculate weighted average rating
            if (combinedStats.ratingCount > 0) {
                const totalRatingPoints = (vsCodeStats.rating * vsCodeStats.ratingCount) + (openVsxStats.rating * openVsxStats.ratingCount);
                combinedStats.rating = totalRatingPoints / combinedStats.ratingCount;
            }

            // Cache the results
            localStorage.setItem(cacheKey, JSON.stringify({
                data: combinedStats,
                timestamp: Date.now()
            }));

            updateStatsDisplay(combinedStats);
            
        } catch (error) {
            console.warn('Failed to fetch extension stats:', error);
            // Fallback to default values
            updateStatsDisplay({
                downloads: '1000+',
                installs: '500+',
                rating: '4.5',
                ratingCount: '50+'
            });
        }
    }

    // Fetch stats from VS Code Marketplace
    async function fetchVSCodeStats(extensionId) {
        const response = await fetch(`https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json;api-version=3.0-preview.1'
            },
            body: JSON.stringify({
                filters: [{
                    criteria: [{
                        filterType: 7,
                        value: extensionId
                    }]
                }],
                flags: 950
            })
        });

        if (!response.ok) {
            throw new Error(`VS Code Marketplace API error: ${response.status}`);
        }

        const data = await response.json();
        const extension = data.results[0].extensions[0];
        
        return {
            downloads: extension.statistics.find(stat => stat.statisticName === 'downloadCount')?.value || 0,
            installs: extension.statistics.find(stat => stat.statisticName === 'install')?.value || 0,
            rating: extension.statistics.find(stat => stat.statisticName === 'averagerating')?.value || 0,
            ratingCount: extension.statistics.find(stat => stat.statisticName === 'ratingcount')?.value || 0
        };
    }

    // Fetch stats from Open VSX Registry
    async function fetchOpenVsxStats(extensionId) {
        // Extract publisher and name from extensionId (format: publisher.name)
        const [publisher, name] = extensionId.split('.');
        const response = await fetch(`https://open-vsx.org/api/${publisher}/${name}`);
        
        if (!response.ok) {
            throw new Error(`Open VSX API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data || data.error) {
            return { downloads: 0, installs: 0, rating: 0, ratingCount: 0 };
        }

        return {
            downloads: data.downloadCount || 0,
            installs: data.downloadCount || 0, // Open VSX uses downloadCount for both
            rating: data.averageRating || 0,
            ratingCount: data.reviewCount || 0 // Open VSX uses reviewCount for rating count
        };
    }

    function updateStatsDisplay(stats) {
        const installElement = document.getElementById('install-count');
        const ratingElement = document.getElementById('rating-count');

        if (installElement) {
            const installs = typeof stats.installs === 'number' ? formatNumber(stats.installs) : stats.installs;
            installElement.textContent = installs;
            installElement.dataset.finalValue = installs.replace(/[^0-9]/g, '');
        }

        if (ratingElement) {
            const rating = typeof stats.rating === 'number' ? stats.rating.toFixed(1) : stats.rating;
            const ratingDisplay = stats.ratingCount ? `${rating} ⭐ (${stats.ratingCount})` : `${rating} ⭐`;
            ratingElement.textContent = ratingDisplay;
        }

        // Re-setup stats observer for new elements
        setupStatsObserver();
    }

    function formatNumber(num) {
        return num.toLocaleString();
    }

    // Enhanced stats counter animation for dynamic content
    function setupStatsObserver() {
        const stats = document.querySelectorAll('.stat-number');
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    const textContent = entry.target.textContent;
                    
                    // Skip if still loading or if it's a rating with stars
                    if (textContent === 'Loading...' || textContent.includes('⭐')) {
                        return;
                    }
                    
                    // Extract numeric value for animation
                    let numericValue = entry.target.dataset.finalValue || textContent.replace(/[^0-9]/g, '');
                    if (numericValue && !isNaN(numericValue)) {
                        const endValue = parseInt(numericValue);
                        
                        // Animate to the exact number value
                        animateCounter(entry.target, 0, endValue, 2000, '');
                        entry.target.dataset.animated = 'true';
                    }
                    
                    statsObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        stats.forEach(stat => statsObserver.observe(stat));
    }

    function animateCounter(element, start, end, duration, suffix = '') {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;

        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                // Format the final number with locale-specific formatting
                element.textContent = Math.floor(end).toLocaleString() + suffix;
                clearInterval(timer);
            } else {
                // Format the current number with locale-specific formatting
                element.textContent = Math.floor(current).toLocaleString() + suffix;
            }
        }, 16);
    }

    // Initialize stats fetching
    // Clear cache to force refresh with correct values
    localStorage.removeItem('extension_stats_cache');
    fetchExtensionStats();

    // Add active state to current nav link based on scroll position
    const sections = document.querySelectorAll('section[id]');
    
    function highlightNavigation() {
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);

            if (navLink && scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                });
                navLink.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', highlightNavigation);

    console.log('Simple Coding Time Tracker - Website loaded successfully! 🚀');
});
