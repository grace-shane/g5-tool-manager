        const app = {
            allTools: [],
            filteredTools: [],
            sortColumn: 'product-id',
            sortDirection: 'asc',
            selectedTool: null,
            currentToolCategory: 'unknown', // 'mill', 'drill', 'holder', or 'mixed'
            loadedLibraries: {}, // Track loaded libraries by filename

            // Define column configurations for different tool types
            columnConfigs: {
                mill: [
                    { key: 'product-id', label: 'Product ID', width: '120px', sortable: true },
                    { key: 'type', label: 'Type', width: '100px', sortable: true },
                    { key: 'description', label: 'Description', width: '400px', sortable: true },
                    { key: 'DC', label: 'Dia (DC)', width: '80px', sortable: true, isGeometry: true },
                    { key: 'LCF', label: 'LOC', width: '80px', sortable: true, isGeometry: true },
                    { key: 'OAL', label: 'OAL', width: '80px', sortable: true, isGeometry: true },
                    { key: 'NOF', label: 'Flutes', width: '60px', sortable: true, isGeometry: true },
                    { key: 'RE', label: 'Radius', width: '80px', sortable: true, isGeometry: true },
                    { key: 'BMC', label: 'Material', width: '100px', sortable: true }
                ],
                drill: [
                    { key: 'product-id', label: 'Product ID', width: '120px', sortable: true },
                    { key: 'type', label: 'Type', width: '80px', sortable: true },
                    { key: 'description', label: 'Description', width: '400px', sortable: true },
                    { key: 'DC', label: 'Dia (DC)', width: '80px', sortable: true, isGeometry: true },
                    { key: 'LCF', label: 'Depth', width: '80px', sortable: true, isGeometry: true },
                    { key: 'OAL', label: 'OAL', width: '80px', sortable: true, isGeometry: true },
                    { key: 'NOF', label: 'Flutes', width: '60px', sortable: true, isGeometry: true },
                    { key: 'SIG', label: 'Point Angle', width: '90px', sortable: true, isGeometry: true },
                    { key: 'BMC', label: 'Material', width: '100px', sortable: true }
                ],
                holder: [
                    { key: 'product-id', label: 'Product ID', width: '120px', sortable: true },
                    { key: 'type', label: 'Type', width: '100px', sortable: true },
                    { key: 'description', label: 'Description', width: '500px', sortable: true },
                    { key: 'gaugeLength', label: 'Gauge Length', width: '120px', sortable: true },
                    { key: 'unit', label: 'Unit', width: '100px', sortable: true },
                    { key: 'vendor', label: 'Vendor', width: '150px', sortable: true }
                ],
                mixed: [
                    { key: 'product-id', label: 'Product ID', width: '120px', sortable: true },
                    { key: 'type', label: 'Type', width: '100px', sortable: true },
                    { key: 'description', label: 'Description', width: '500px', sortable: true },
                    { key: 'vendor', label: 'Vendor', width: '150px', sortable: true }
                ]
            },

            init() {
                this.setupEventListeners();
                this.showWelcomeMessage();
            },

            showWelcomeMessage() {
                document.getElementById('tableBody').innerHTML = 
                    '<div style="padding: 2rem; text-align: center; color: var(--text-secondary); line-height: 1.8;">' +
                    '<div style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--accent-primary); font-weight: 700;">G5 TOOL MANAGER</div>' +
                    '<div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Fusion Tool Library Viewer</div>' +
                    '<div>Click "Choose File" above to load one or more tool library JSON files</div>' +
                    '</div>';
            },

            async loadToolLibraries(files) {
                try {
                    document.getElementById('tableBody').innerHTML = '<div class="loading">Loading tools</div>';
                    
                    for (const file of files) {
                        const text = await file.text();
                        const data = JSON.parse(text);
                        
                        // Store library info
                        this.loadedLibraries[file.name] = {
                            name: file.name,
                            count: data.data.length,
                            tools: data.data
                        };
                    }
                    
                    // Merge all tools from all libraries
                    this.allTools = Object.values(this.loadedLibraries).flatMap(lib => lib.tools);
                    this.filteredTools = [...this.allTools];
                    
                    // Determine tool category
                    this.detectToolCategory();
                    
                    document.getElementById('totalTools').textContent = this.allTools.length.toLocaleString();
                    document.getElementById('filteredTools').textContent = this.filteredTools.length.toLocaleString();
                    document.getElementById('vendor').textContent = this.getUniqueVendors().join(', ') || 'Unknown';
                    
                    this.updateLoadedLibrariesDisplay();
                    this.populateFilters();
                    this.setupTableHeaders();
                    this.enableControls();
                    this.updateFilterVisibility();
                    this.renderTable();
                } catch (error) {
                    console.error('Error loading tool library:', error);
                    document.getElementById('tableBody').innerHTML = 
                        '<div style="padding: 2rem; text-align: center; color: var(--text-primary);">Error loading tool library. Please ensure the file is a valid Fusion tool library JSON.</div>';
                }
            },

            updateLoadedLibrariesDisplay() {
                const libraryCount = Object.keys(this.loadedLibraries).length;
                const container = document.getElementById('loadedLibrariesGroup');
                const list = document.getElementById('loadedLibrariesList');
                
                if (libraryCount === 0) {
                    container.style.display = 'none';
                    return;
                }
                
                container.style.display = 'flex';
                list.innerHTML = '';
                
                // Add library tags
                Object.entries(this.loadedLibraries).forEach(([filename, lib]) => {
                    const tag = document.createElement('div');
                    tag.className = 'library-tag';
                    tag.innerHTML = `
                        <span class="library-tag-name">${lib.name}</span>
                        <span class="library-tag-count">(${lib.count.toLocaleString()})</span>
                        <span class="library-tag-remove" onclick="app.removeLibrary('${filename.replace(/'/g, "\\'")}')">✕</span>
                    `;
                    list.appendChild(tag);
                });
                
                // Add clear all button if multiple libraries
                if (libraryCount > 1) {
                    const clearBtn = document.createElement('button');
                    clearBtn.className = 'clear-all-btn';
                    clearBtn.textContent = 'Clear All';
                    clearBtn.onclick = () => this.clearAllLibraries();
                    list.appendChild(clearBtn);
                }
            },

            removeLibrary(filename) {
                delete this.loadedLibraries[filename];
                
                if (Object.keys(this.loadedLibraries).length === 0) {
                    // No libraries left, reset everything
                    this.clearAllLibraries();
                } else {
                    // Rebuild tool list from remaining libraries
                    this.allTools = Object.values(this.loadedLibraries).flatMap(lib => lib.tools);
                    this.filteredTools = [...this.allTools];
                    
                    this.detectToolCategory();
                    document.getElementById('totalTools').textContent = this.allTools.length.toLocaleString();
                    document.getElementById('filteredTools').textContent = this.filteredTools.length.toLocaleString();
                    document.getElementById('vendor').textContent = this.getUniqueVendors().join(', ') || 'Unknown';
                    
                    this.updateLoadedLibrariesDisplay();
                    this.populateFilters();
                    this.setupTableHeaders();
                    this.updateFilterVisibility();
                    this.applyFilters();
                }
            },

            clearAllLibraries() {
                this.loadedLibraries = {};
                this.allTools = [];
                this.filteredTools = [];
                this.selectedTool = null;
                this.currentToolCategory = 'unknown';
                
                document.getElementById('totalTools').textContent = '0';
                document.getElementById('filteredTools').textContent = '0';
                document.getElementById('vendor').textContent = '—';
                document.getElementById('fileInput').value = '';
                
                this.updateLoadedLibrariesDisplay();
                this.disableControls();
                this.showWelcomeMessage();
                
                // Close detail panel
                document.getElementById('detailPanel').classList.remove('active');
            },

            disableControls() {
                document.getElementById('searchInput').disabled = true;
                document.getElementById('typeFilter').disabled = true;
                document.getElementById('vendorFilter').disabled = true;
                document.getElementById('minDiameter').disabled = true;
                document.getElementById('maxDiameter').disabled = true;
                document.getElementById('flutesFilter').disabled = true;
                if (document.getElementById('radiusFilter')) document.getElementById('radiusFilter').disabled = true;
                if (document.getElementById('pointAngleFilter')) document.getElementById('pointAngleFilter').disabled = true;
                document.getElementById('minGaugeLength').disabled = true;
                document.getElementById('maxGaugeLength').disabled = true;
                document.getElementById('exportBtn').disabled = true;
            },

            exportMergedLibrary() {
                if (this.allTools.length === 0) {
                    alert('No tools loaded to export.');
                    return;
                }

                // Create the merged library structure
                const mergedLibrary = {
                    data: this.allTools
                };

                // Convert to JSON string with formatting
                const jsonString = JSON.stringify(mergedLibrary, null, 4);

                // Create blob and download
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // Generate filename
                const libraryCount = Object.keys(this.loadedLibraries).length;
                const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                let filename;
                
                if (libraryCount === 1) {
                    // Single library - use its name
                    const originalName = Object.keys(this.loadedLibraries)[0];
                    filename = originalName.replace('.json', '') + '_merged.json';
                } else {
                    // Multiple libraries - create descriptive name
                    const vendors = this.getUniqueVendors();
                    const vendorName = vendors.length === 1 ? vendors[0].replace(/\s+/g, '_') : 'Multi_Vendor';
                    filename = `${vendorName}_Tool_Library_${timestamp}.json`;
                }
                
                // Create download link and trigger
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                
                // Cleanup
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                // Show confirmation
                const toolCount = this.allTools.length.toLocaleString();
                const message = `Exported ${toolCount} tools from ${libraryCount} ${libraryCount === 1 ? 'library' : 'libraries'} to ${filename}`;
                
                // Create temporary toast notification
                const toast = document.createElement('div');
                toast.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--bg-secondary);
                    border: 2px solid var(--accent-primary);
                    color: var(--text-primary);
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    font-family: 'Roboto Mono', monospace;
                    font-size: 0.9rem;
                    box-shadow: 0 4px 20px rgba(0, 255, 65, 0.3);
                    z-index: 10000;
                    animation: slideIn 0.3s ease-out;
                `;
                toast.textContent = message;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.style.animation = 'slideOut 0.3s ease-out';
                    setTimeout(() => document.body.removeChild(toast), 300);
                }, 3000);
            },

            detectToolCategory() {
                const types = [...new Set(this.allTools.map(t => t.type))];
                
                if (types.length === 1) {
                    const type = types[0];
                    if (type === 'holder') {
                        this.currentToolCategory = 'holder';
                    } else if (type === 'drill') {
                        this.currentToolCategory = 'drill';
                    } else {
                        this.currentToolCategory = 'mill';
                    }
                } else if (types.every(t => t === 'drill' || t.includes('mill'))) {
                    this.currentToolCategory = 'mixed';
                } else if (types.includes('holder')) {
                    this.currentToolCategory = 'mixed';
                } else {
                    this.currentToolCategory = 'mill';
                }
            },

            getUniqueVendors() {
                return [...new Set(this.allTools.map(t => t.vendor).filter(v => v))];
            },

            setupTableHeaders() {
                const config = this.columnConfigs[this.currentToolCategory] || this.columnConfigs.mixed;
                const headerHTML = config.map(col => {
                    const gridWidth = col.width;
                    return `
                        <div class="table-header-cell" onclick="app.sortBy('${col.key}')" style="grid-column: span 1;">
                            ${col.label}
                            <span class="sort-indicator" data-column="${col.key}">↕</span>
                        </div>
                    `;
                }).join('');
                
                const gridTemplate = config.map(c => c.width).join(' ');
                const tableHeader = document.getElementById('tableHeader');
                tableHeader.innerHTML = headerHTML;
                tableHeader.style.gridTemplateColumns = gridTemplate;
            },

            enableControls() {
                document.getElementById('searchInput').disabled = false;
                document.getElementById('typeFilter').disabled = false;
                document.getElementById('vendorFilter').disabled = false;
                document.getElementById('exportBtn').disabled = false;
                
                // Enable type-specific controls
                if (this.currentToolCategory === 'mill' || this.currentToolCategory === 'drill' || this.currentToolCategory === 'mixed') {
                    document.getElementById('minDiameter').disabled = false;
                    document.getElementById('maxDiameter').disabled = false;
                    document.getElementById('flutesFilter').disabled = false;
                }
                
                if (this.currentToolCategory === 'mill') {
                    document.getElementById('radiusFilter').disabled = false;
                }
                
                if (this.currentToolCategory === 'drill') {
                    document.getElementById('pointAngleFilter').disabled = false;
                }
                
                if (this.currentToolCategory === 'holder') {
                    document.getElementById('minGaugeLength').disabled = false;
                    document.getElementById('maxGaugeLength').disabled = false;
                }
            },

            updateFilterVisibility() {
                const typeFilter = document.getElementById('typeFilter').value;
                
                // Hide all filter groups first
                document.querySelectorAll('.filter-cutting, .filter-mill, .filter-drill, .filter-holder').forEach(el => {
                    el.style.display = 'none';
                });
                
                // Determine what to show based on selected type or overall category
                if (typeFilter === '' || typeFilter === 'all') {
                    // Show based on library category
                    if (this.currentToolCategory === 'mill') {
                        document.querySelectorAll('.filter-cutting, .filter-mill').forEach(el => el.style.display = 'flex');
                    } else if (this.currentToolCategory === 'drill') {
                        document.querySelectorAll('.filter-cutting, .filter-drill').forEach(el => el.style.display = 'flex');
                    } else if (this.currentToolCategory === 'holder') {
                        document.querySelectorAll('.filter-holder').forEach(el => el.style.display = 'flex');
                    } else if (this.currentToolCategory === 'mixed') {
                        // Show common cutting tool filters for mixed libraries
                        document.querySelectorAll('.filter-cutting').forEach(el => el.style.display = 'flex');
                    }
                } else if (typeFilter === 'holder') {
                    document.querySelectorAll('.filter-holder').forEach(el => el.style.display = 'flex');
                } else if (typeFilter === 'drill') {
                    document.querySelectorAll('.filter-cutting, .filter-drill').forEach(el => el.style.display = 'flex');
                } else {
                    // Mill types
                    document.querySelectorAll('.filter-cutting, .filter-mill').forEach(el => el.style.display = 'flex');
                }
            },

            populateFilters() {
                // Populate tool types
                const types = [...new Set(this.allTools.map(t => t.type))].sort();
                const typeFilter = document.getElementById('typeFilter');
                typeFilter.innerHTML = '<option value="">All Types</option>';
                types.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type;
                    typeFilter.appendChild(option);
                });

                // Populate vendors
                const vendors = this.getUniqueVendors().sort();
                const vendorFilter = document.getElementById('vendorFilter');
                vendorFilter.innerHTML = '<option value="">All Vendors</option>';
                vendors.forEach(vendor => {
                    const option = document.createElement('option');
                    option.value = vendor;
                    option.textContent = vendor;
                    vendorFilter.appendChild(option);
                });

                // Populate flutes (if applicable)
                const flutes = [...new Set(this.allTools.map(t => t.geometry?.NOF).filter(f => f))].sort((a, b) => a - b);
                const flutesFilter = document.getElementById('flutesFilter');
                flutesFilter.innerHTML = '<option value="">All</option>';
                flutes.forEach(flute => {
                    const option = document.createElement('option');
                    option.value = flute;
                    option.textContent = flute;
                    flutesFilter.appendChild(option);
                });

                // Populate corner radius (for mills)
                const radii = [...new Set(this.allTools.map(t => t.geometry?.RE).filter(r => r !== undefined && r !== null))].sort((a, b) => a - b);
                const radiusFilter = document.getElementById('radiusFilter');
                if (radiusFilter) {
                    radiusFilter.innerHTML = '<option value="">All</option>';
                    radii.forEach(radius => {
                        const option = document.createElement('option');
                        option.value = radius;
                        option.textContent = this.formatNumber(radius);
                        radiusFilter.appendChild(option);
                    });
                }

                // Populate point angles (for drills)
                const angles = [...new Set(this.allTools.map(t => t.geometry?.SIG).filter(a => a))].sort((a, b) => a - b);
                const pointAngleFilter = document.getElementById('pointAngleFilter');
                if (pointAngleFilter) {
                    pointAngleFilter.innerHTML = '<option value="">All</option>';
                    angles.forEach(angle => {
                        const option = document.createElement('option');
                        option.value = angle;
                        option.textContent = angle + '°';
                        pointAngleFilter.appendChild(option);
                    });
                }
            },

            setupEventListeners() {
                const fileInput = document.getElementById('fileInput');
                const searchInput = document.getElementById('searchInput');
                const typeFilter = document.getElementById('typeFilter');
                const vendorFilter = document.getElementById('vendorFilter');
                const minDiameter = document.getElementById('minDiameter');
                const maxDiameter = document.getElementById('maxDiameter');
                const flutesFilter = document.getElementById('flutesFilter');
                const radiusFilter = document.getElementById('radiusFilter');
                const pointAngleFilter = document.getElementById('pointAngleFilter');
                const minGaugeLength = document.getElementById('minGaugeLength');
                const maxGaugeLength = document.getElementById('maxGaugeLength');

                fileInput.addEventListener('change', (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                        this.loadToolLibraries(files);
                    }
                });

                searchInput.addEventListener('input', () => this.applyFilters());
                typeFilter.addEventListener('change', () => {
                    this.updateFilterVisibility();
                    this.applyFilters();
                });
                vendorFilter.addEventListener('change', () => this.applyFilters());
                minDiameter.addEventListener('input', () => this.applyFilters());
                maxDiameter.addEventListener('input', () => this.applyFilters());
                flutesFilter.addEventListener('change', () => this.applyFilters());
                radiusFilter.addEventListener('change', () => this.applyFilters());
                pointAngleFilter.addEventListener('change', () => this.applyFilters());
                minGaugeLength.addEventListener('input', () => this.applyFilters());
                maxGaugeLength.addEventListener('input', () => this.applyFilters());
            },

            applyFilters() {
                const search = document.getElementById('searchInput').value.toLowerCase();
                const type = document.getElementById('typeFilter').value;
                const vendor = document.getElementById('vendorFilter').value;
                const minDia = parseFloat(document.getElementById('minDiameter').value) || 0;
                const maxDia = parseFloat(document.getElementById('maxDiameter').value) || Infinity;
                const flutes = document.getElementById('flutesFilter').value;
                const radius = document.getElementById('radiusFilter')?.value;
                const pointAngle = document.getElementById('pointAngleFilter')?.value;
                const minGauge = parseFloat(document.getElementById('minGaugeLength').value) || 0;
                const maxGauge = parseFloat(document.getElementById('maxGaugeLength').value) || Infinity;

                this.filteredTools = this.allTools.filter(tool => {
                    const matchesSearch = !search || 
                        tool['product-id']?.toLowerCase().includes(search) ||
                        tool.description?.toLowerCase().includes(search);
                    
                    const matchesType = !type || tool.type === type;
                    const matchesVendor = !vendor || tool.vendor === vendor;
                    
                    // Diameter filter (for cutting tools)
                    const diameter = tool.geometry?.DC || 0;
                    const matchesDiameter = !tool.geometry || (diameter >= minDia && diameter <= maxDia);
                    
                    // Flutes filter
                    const matchesFlutes = !flutes || tool.geometry?.NOF == flutes;
                    
                    // Radius filter (for mills)
                    const matchesRadius = !radius || tool.geometry?.RE == radius;
                    
                    // Point angle filter (for drills)
                    const matchesPointAngle = !pointAngle || tool.geometry?.SIG == pointAngle;
                    
                    // Gauge length filter (for holders)
                    const gaugeLength = tool.gaugeLength || 0;
                    const matchesGaugeLength = !tool.gaugeLength || (gaugeLength >= minGauge && gaugeLength <= maxGauge);

                    return matchesSearch && matchesType && matchesVendor && matchesDiameter && 
                           matchesFlutes && matchesRadius && matchesPointAngle && matchesGaugeLength;
                });

                document.getElementById('filteredTools').textContent = this.filteredTools.length.toLocaleString();
                this.renderTable();
            },

            resetFilters() {
                document.getElementById('searchInput').value = '';
                document.getElementById('typeFilter').value = '';
                document.getElementById('vendorFilter').value = '';
                document.getElementById('minDiameter').value = '';
                document.getElementById('maxDiameter').value = '';
                document.getElementById('flutesFilter').value = '';
                if (document.getElementById('radiusFilter')) document.getElementById('radiusFilter').value = '';
                if (document.getElementById('pointAngleFilter')) document.getElementById('pointAngleFilter').value = '';
                document.getElementById('minGaugeLength').value = '';
                document.getElementById('maxGaugeLength').value = '';
                this.updateFilterVisibility();
                this.applyFilters();
            },

            sortBy(column) {
                if (this.sortColumn === column) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = column;
                    this.sortDirection = 'asc';
                }

                const config = this.columnConfigs[this.currentToolCategory] || this.columnConfigs.mixed;
                const columnConfig = config.find(c => c.key === column);

                this.filteredTools.sort((a, b) => {
                    let aVal, bVal;

                    if (columnConfig && columnConfig.isGeometry) {
                        aVal = a.geometry?.[column] || 0;
                        bVal = b.geometry?.[column] || 0;
                    } else {
                        aVal = a[column] || '';
                        bVal = b[column] || '';
                    }

                    if (typeof aVal === 'string') {
                        return this.sortDirection === 'asc' 
                            ? aVal.localeCompare(bVal)
                            : bVal.localeCompare(aVal);
                    } else {
                        return this.sortDirection === 'asc' 
                            ? aVal - bVal
                            : bVal - aVal;
                    }
                });

                this.updateSortIndicators();
                this.renderTable();
            },

            updateSortIndicators() {
                document.querySelectorAll('.sort-indicator').forEach(el => {
                    el.classList.remove('active');
                    el.textContent = '↕';
                });

                const indicator = document.querySelector(`[data-column="${this.sortColumn}"]`);
                if (indicator) {
                    indicator.classList.add('active');
                    indicator.textContent = this.sortDirection === 'asc' ? '↑' : '↓';
                }
            },

            renderTable() {
                const tbody = document.getElementById('tableBody');
                tbody.innerHTML = '';

                if (this.filteredTools.length === 0) {
                    tbody.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">No tools match the current filters.</div>';
                    return;
                }

                const config = this.columnConfigs[this.currentToolCategory] || this.columnConfigs.mixed;
                const gridTemplate = config.map(c => c.width).join(' ');

                this.filteredTools.forEach(tool => {
                    const row = document.createElement('div');
                    row.className = 'table-row';
                    row.style.gridTemplateColumns = gridTemplate;
                    row.onclick = () => this.selectTool(tool);
                    
                    const cells = config.map(col => {
                        let value;
                        if (col.isGeometry) {
                            value = tool.geometry?.[col.key];
                        } else {
                            value = tool[col.key];
                        }
                        
                        const formatted = col.key === 'description' 
                            ? (value || '—') 
                            : this.formatNumber(value);
                        
                        const cellClass = col.key === 'description' ? 'table-cell description' : 'table-cell';
                        return `<div class="${cellClass}">${formatted}</div>`;
                    }).join('');
                    
                    row.innerHTML = cells;
                    tbody.appendChild(row);
                });
            },

            selectTool(tool) {
                this.selectedTool = tool;
                
                // Update selection highlight
                document.querySelectorAll('.table-row').forEach(row => row.classList.remove('selected'));
                event.currentTarget.classList.add('selected');
                
                // Show detail panel
                const detailPanel = document.getElementById('detailPanel');
                detailPanel.classList.add('active');
                
                this.renderToolDetails(tool);
            },

            renderToolDetails(tool) {
                const detailPanel = document.getElementById('detailPanel');
                const geo = tool.geometry || {};
                const preset = tool['start-values']?.presets?.[0] || {};
                
                let detailsHTML = `
                    <div class="detail-header">
                        <div class="detail-title">${tool.type || 'Unknown Tool'}</div>
                        <div class="detail-product-id">Product ID: ${tool['product-id'] || '—'}</div>
                        ${tool['product-link'] ? `<a href="${tool['product-link']}" target="_blank" class="detail-link">View on Vendor Site ↗</a>` : ''}
                    </div>
                    
                    <div class="detail-content">
                        <div class="detail-section">
                            <div class="section-title">Description</div>
                            <p style="font-size: 0.85rem; line-height: 1.6; color: var(--text-primary);">${tool.description || '—'}</p>
                        </div>
                `;

                // Render geometry section for cutting tools
                if (tool.geometry) {
                    detailsHTML += `
                        <div class="detail-section">
                            <div class="section-title">Geometry</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Diameter (DC)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.DC)} ${tool.unit || 'in'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Shank Diameter</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.SFDM)} ${tool.unit || 'in'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Length of Cut (LOC)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.LCF)} ${tool.unit || 'in'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Overall Length (OAL)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.OAL)} ${tool.unit || 'in'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Number of Flutes</div>
                                    <div class="detail-item-value">${geo.NOF || '—'}</div>
                                </div>
                                ${tool.type === 'drill' ? `
                                <div class="detail-item">
                                    <div class="detail-item-label">Point Angle (SIG)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.SIG)}°</div>
                                </div>
                                ` : `
                                <div class="detail-item">
                                    <div class="detail-item-label">Corner Radius (RE)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.RE)} ${tool.unit || 'in'}</div>
                                </div>
                                `}
                                <div class="detail-item">
                                    <div class="detail-item-label">Gauge Length (LB)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.LB)} ${tool.unit || 'in'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Hand</div>
                                    <div class="detail-item-value">${geo.HAND ? 'Right' : 'Left'}</div>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <div class="section-title">Material & Coating</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Base Material</div>
                                    <div class="detail-item-value">${tool.BMC || '—'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Grade</div>
                                    <div class="detail-item-value">${tool.GRADE || '—'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Render holder-specific details
                if (tool.type === 'holder') {
                    detailsHTML += `
                        <div class="detail-section">
                            <div class="section-title">Holder Specifications</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Gauge Length</div>
                                    <div class="detail-item-value">${this.formatNumber(tool.gaugeLength)} ${tool.unit || 'mm'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Unit</div>
                                    <div class="detail-item-value">${tool.unit || '—'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Render preset if available
                if (preset.name) {
                    detailsHTML += `
                        <div class="detail-section">
                            <div class="section-title">Default Preset</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Cutting Speed (v_c)</div>
                                    <div class="detail-item-value">${this.formatNumber(preset.v_c)} ${tool.unit}/min</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Feed Rate (v_f)</div>
                                    <div class="detail-item-value">${this.formatNumber(preset.v_f)} ${tool.unit}/min</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Spindle Speed (n)</div>
                                    <div class="detail-item-value">${this.formatNumber(preset.n)} RPM</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Coolant</div>
                                    <div class="detail-item-value">${preset['tool-coolant'] || '—'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Render post-process if available
                if (tool['post-process']) {
                    detailsHTML += `
                        <div class="detail-section">
                            <div class="section-title">Post Process</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Tool Number</div>
                                    <div class="detail-item-value">${tool['post-process']?.number || 0}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Manual Change</div>
                                    <div class="detail-item-value">${tool['post-process']?.['manual-tool-change'] ? 'Yes' : 'No'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Break Control</div>
                                    <div class="detail-item-value">${tool['post-process']?.['break-control'] ? 'Yes' : 'No'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Live Tool</div>
                                    <div class="detail-item-value">${tool['post-process']?.live ? 'Yes' : 'No'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                detailsHTML += `
                        <div class="detail-section">
                            <div class="section-title">Additional Info</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Vendor</div>
                                    <div class="detail-item-value">${tool.vendor || '—'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Unit</div>
                                    <div class="detail-item-value">${tool.unit || '—'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">GUID</div>
                                    <div class="detail-item-value" style="font-size: 0.7rem; word-break: break-all;">${tool.guid || '—'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                detailPanel.innerHTML = detailsHTML;
            },

            formatNumber(value) {
                if (value === undefined || value === null || value === 0) return '—';
                if (typeof value === 'number') {
                    return value.toFixed(4).replace(/\.?0+$/, '');
                }
                return value;
            }
        };

        // Initialize the app when DOM is ready
        document.addEventListener('DOMContentLoaded', () => app.init());
    </script>

            // Define column configurations for different tool types
            columnConfigs: {
                mill: [
                    { key: 'product-id', label: 'Product ID', width: '120px', sortable: true },
                    { key: 'type', label: 'Type', width: '100px', sortable: true },
                    { key: 'description', label: 'Description', width: '400px', sortable: true },
                    { key: 'DC', label: 'Dia (DC)', width: '80px', sortable: true, isGeometry: true },
                    { key: 'LCF', label: 'LOC', width: '80px', sortable: true, isGeometry: true },
                    { key: 'OAL', label: 'OAL', width: '80px', sortable: true, isGeometry: true },
                    { key: 'NOF', label: 'Flutes', width: '60px', sortable: true, isGeometry: true },
                    { key: 'RE', label: 'Radius', width: '80px', sortable: true, isGeometry: true },
                    { key: 'BMC', label: 'Material', width: '100px', sortable: true }
                ],
                drill: [
                    { key: 'product-id', label: 'Product ID', width: '120px', sortable: true },
                    { key: 'type', label: 'Type', width: '80px', sortable: true },
                    { key: 'description', label: 'Description', width: '400px', sortable: true },
                    { key: 'DC', label: 'Dia (DC)', width: '80px', sortable: true, isGeometry: true },
                    { key: 'LCF', label: 'Depth', width: '80px', sortable: true, isGeometry: true },
                    { key: 'OAL', label: 'OAL', width: '80px', sortable: true, isGeometry: true },
                    { key: 'NOF', label: 'Flutes', width: '60px', sortable: true, isGeometry: true },
                    { key: 'SIG', label: 'Point Angle', width: '90px', sortable: true, isGeometry: true },
                    { key: 'BMC', label: 'Material', width: '100px', sortable: true }
                ],
                holder: [
                    { key: 'product-id', label: 'Product ID', width: '120px', sortable: true },
                    { key: 'type', label: 'Type', width: '100px', sortable: true },
                    { key: 'description', label: 'Description', width: '500px', sortable: true },
                    { key: 'gaugeLength', label: 'Gauge Length', width: '120px', sortable: true },
                    { key: 'unit', label: 'Unit', width: '100px', sortable: true },
                    { key: 'vendor', label: 'Vendor', width: '150px', sortable: true }
                ],
                mixed: [
                    { key: 'product-id', label: 'Product ID', width: '120px', sortable: true },
                    { key: 'type', label: 'Type', width: '100px', sortable: true },
                    { key: 'description', label: 'Description', width: '500px', sortable: true },
                    { key: 'vendor', label: 'Vendor', width: '150px', sortable: true }
                ]
            },

            init() {
                this.setupEventListeners();
                this.showWelcomeMessage();
            },

            showWelcomeMessage() {
                document.getElementById('tableBody').innerHTML = 
                    '<div style="padding: 2rem; text-align: center; color: var(--text-secondary); line-height: 1.8;">' +
                    '<div style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--accent-primary); font-weight: 700;">G5 TOOL MANAGER</div>' +
                    '<div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Fusion Tool Library Viewer</div>' +
                    '<div>Click "Choose File" above to load a tool library JSON file</div>' +
                    '</div>';
            },

            async loadToolLibrary(file) {
                try {
                    document.getElementById('tableBody').innerHTML = '<div class="loading">Loading tools</div>';
                    
                    const text = await file.text();
                    const data = JSON.parse(text);
                    
                    this.allTools = data.data;
                    this.filteredTools = [...this.allTools];
                    
                    // Determine tool category
                    this.detectToolCategory();
                    
                    document.getElementById('totalTools').textContent = this.allTools.length.toLocaleString();
                    document.getElementById('filteredTools').textContent = this.filteredTools.length.toLocaleString();
                    document.getElementById('vendor').textContent = this.getUniqueVendors().join(', ') || 'Unknown';
                    
                    this.populateFilters();
                    this.setupTableHeaders();
                    this.enableControls();
                    this.updateFilterVisibility();
                    this.renderTable();
                } catch (error) {
                    console.error('Error loading tool library:', error);
                    document.getElementById('tableBody').innerHTML = 
                        '<div style="padding: 2rem; text-align: center; color: var(--text-primary);">Error loading tool library. Please ensure the file is a valid Fusion tool library JSON.</div>';
                }
            },

            detectToolCategory() {
                const types = [...new Set(this.allTools.map(t => t.type))];
                
                if (types.length === 1) {
                    const type = types[0];
                    if (type === 'holder') {
                        this.currentToolCategory = 'holder';
                    } else if (type === 'drill') {
                        this.currentToolCategory = 'drill';
                    } else {
                        this.currentToolCategory = 'mill';
                    }
                } else if (types.every(t => t === 'drill' || t.includes('mill'))) {
                    this.currentToolCategory = 'mixed';
                } else if (types.includes('holder')) {
                    this.currentToolCategory = 'mixed';
                } else {
                    this.currentToolCategory = 'mill';
                }
            },

            getUniqueVendors() {
                return [...new Set(this.allTools.map(t => t.vendor).filter(v => v))];
            },

            setupTableHeaders() {
                const config = this.columnConfigs[this.currentToolCategory] || this.columnConfigs.mixed;
                const headerHTML = config.map(col => {
                    const gridWidth = col.width;
                    return `
                        <div class="table-header-cell" onclick="app.sortBy('${col.key}')" style="grid-column: span 1;">
                            ${col.label}
                            <span class="sort-indicator" data-column="${col.key}">↕</span>
                        </div>
                    `;
                }).join('');
                
                const gridTemplate = config.map(c => c.width).join(' ');
                const tableHeader = document.getElementById('tableHeader');
                tableHeader.innerHTML = headerHTML;
                tableHeader.style.gridTemplateColumns = gridTemplate;
            },

                if (this.currentToolCategory === 'holder') {
                    document.getElementById('minGaugeLength').disabled = false;
                    document.getElementById('maxGaugeLength').disabled = false;
                }
            },

            updateFilterVisibility() {
                const typeFilter = document.getElementById('typeFilter').value;
                
                // Hide all filter groups first
                document.querySelectorAll('.filter-cutting, .filter-mill, .filter-drill, .filter-holder').forEach(el => {
                    el.style.display = 'none';
                });
                
                // Determine what to show based on selected type or overall category
                if (typeFilter === '' || typeFilter === 'all') {
                    // Show based on library category
                    if (this.currentToolCategory === 'mill') {
                        document.querySelectorAll('.filter-cutting, .filter-mill').forEach(el => el.style.display = 'flex');
                    } else if (this.currentToolCategory === 'drill') {
                        document.querySelectorAll('.filter-cutting, .filter-drill').forEach(el => el.style.display = 'flex');
                    } else if (this.currentToolCategory === 'holder') {
                        document.querySelectorAll('.filter-holder').forEach(el => el.style.display = 'flex');
                    } else if (this.currentToolCategory === 'mixed') {
                        // Show common cutting tool filters for mixed libraries
                        document.querySelectorAll('.filter-cutting').forEach(el => el.style.display = 'flex');
                    }
                } else if (typeFilter === 'holder') {
                    document.querySelectorAll('.filter-holder').forEach(el => el.style.display = 'flex');
                } else if (typeFilter === 'drill') {
                    document.querySelectorAll('.filter-cutting, .filter-drill').forEach(el => el.style.display = 'flex');
                } else {
                    // Mill types
                    document.querySelectorAll('.filter-cutting, .filter-mill').forEach(el => el.style.display = 'flex');
                }
            },

            populateFilters() {
                // Populate tool types
                const types = [...new Set(this.allTools.map(t => t.type))].sort();
                const typeFilter = document.getElementById('typeFilter');
                typeFilter.innerHTML = '<option value="">All Types</option>';
                types.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type;
                    option.textContent = type;
                    typeFilter.appendChild(option);
                });

                // Populate vendors
                const vendors = this.getUniqueVendors().sort();
                const vendorFilter = document.getElementById('vendorFilter');
                vendorFilter.innerHTML = '<option value="">All Vendors</option>';
                vendors.forEach(vendor => {
                    const option = document.createElement('option');
                    option.value = vendor;
                    option.textContent = vendor;
                    vendorFilter.appendChild(option);
                });

                // Populate flutes (if applicable)
                const flutes = [...new Set(this.allTools.map(t => t.geometry?.NOF).filter(f => f))].sort((a, b) => a - b);
                const flutesFilter = document.getElementById('flutesFilter');
                flutesFilter.innerHTML = '<option value="">All</option>';
                flutes.forEach(flute => {
                    const option = document.createElement('option');
                    option.value = flute;
                    option.textContent = flute;
                    flutesFilter.appendChild(option);
                });

                // Populate corner radius (for mills)
                const radii = [...new Set(this.allTools.map(t => t.geometry?.RE).filter(r => r !== undefined && r !== null))].sort((a, b) => a - b);
                const radiusFilter = document.getElementById('radiusFilter');
                if (radiusFilter) {
                    radiusFilter.innerHTML = '<option value="">All</option>';
                    radii.forEach(radius => {
                        const option = document.createElement('option');
                        option.value = radius;
                        option.textContent = this.formatNumber(radius);
                        radiusFilter.appendChild(option);
                    });
                }

                // Populate point angles (for drills)
                const angles = [...new Set(this.allTools.map(t => t.geometry?.SIG).filter(a => a))].sort((a, b) => a - b);
                const pointAngleFilter = document.getElementById('pointAngleFilter');
                if (pointAngleFilter) {
                    pointAngleFilter.innerHTML = '<option value="">All</option>';
                    angles.forEach(angle => {
                        const option = document.createElement('option');
                        option.value = angle;
                        option.textContent = angle + '°';
                        pointAngleFilter.appendChild(option);
                    });
                }
            },

            setupEventListeners() {
                const fileInput = document.getElementById('fileInput');
                const searchInput = document.getElementById('searchInput');
                const typeFilter = document.getElementById('typeFilter');
                const vendorFilter = document.getElementById('vendorFilter');
                const minDiameter = document.getElementById('minDiameter');
                const maxDiameter = document.getElementById('maxDiameter');
                const flutesFilter = document.getElementById('flutesFilter');
                const radiusFilter = document.getElementById('radiusFilter');
                const pointAngleFilter = document.getElementById('pointAngleFilter');
                const minGaugeLength = document.getElementById('minGaugeLength');
                const maxGaugeLength = document.getElementById('maxGaugeLength');

                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        this.loadToolLibrary(file);
                    }
                });

                searchInput.addEventListener('input', () => this.applyFilters());
                typeFilter.addEventListener('change', () => {
                    this.updateFilterVisibility();
                    this.applyFilters();
                });
                vendorFilter.addEventListener('change', () => this.applyFilters());
                minDiameter.addEventListener('input', () => this.applyFilters());
                maxDiameter.addEventListener('input', () => this.applyFilters());
                flutesFilter.addEventListener('change', () => this.applyFilters());
                radiusFilter.addEventListener('change', () => this.applyFilters());
                pointAngleFilter.addEventListener('change', () => this.applyFilters());
                minGaugeLength.addEventListener('input', () => this.applyFilters());
                maxGaugeLength.addEventListener('input', () => this.applyFilters());
            },

            applyFilters() {
                const search = document.getElementById('searchInput').value.toLowerCase();
                const type = document.getElementById('typeFilter').value;
                const vendor = document.getElementById('vendorFilter').value;
                const minDia = parseFloat(document.getElementById('minDiameter').value) || 0;
                const maxDia = parseFloat(document.getElementById('maxDiameter').value) || Infinity;
                const flutes = document.getElementById('flutesFilter').value;
                const radius = document.getElementById('radiusFilter')?.value;
                const pointAngle = document.getElementById('pointAngleFilter')?.value;
                const minGauge = parseFloat(document.getElementById('minGaugeLength').value) || 0;
                const maxGauge = parseFloat(document.getElementById('maxGaugeLength').value) || Infinity;

                this.filteredTools = this.allTools.filter(tool => {
                    const matchesSearch = !search || 
                        tool['product-id']?.toLowerCase().includes(search) ||
                        tool.description?.toLowerCase().includes(search);
                    
                    const matchesType = !type || tool.type === type;
                    const matchesVendor = !vendor || tool.vendor === vendor;
                    
                    // Diameter filter (for cutting tools)
                    const diameter = tool.geometry?.DC || 0;
                    const matchesDiameter = !tool.geometry || (diameter >= minDia && diameter <= maxDia);
                    
                    // Flutes filter
                    const matchesFlutes = !flutes || tool.geometry?.NOF == flutes;
                    
                    // Radius filter (for mills)
                    const matchesRadius = !radius || tool.geometry?.RE == radius;
                    
                    // Point angle filter (for drills)
                    const matchesPointAngle = !pointAngle || tool.geometry?.SIG == pointAngle;
                    
                    // Gauge length filter (for holders)
                    const gaugeLength = tool.gaugeLength || 0;
                    const matchesGaugeLength = !tool.gaugeLength || (gaugeLength >= minGauge && gaugeLength <= maxGauge);

                    return matchesSearch && matchesType && matchesVendor && matchesDiameter && 
                           matchesFlutes && matchesRadius && matchesPointAngle && matchesGaugeLength;
                });

                document.getElementById('filteredTools').textContent = this.filteredTools.length.toLocaleString();
                this.renderTable();
            },

            resetFilters() {
                document.getElementById('searchInput').value = '';
                document.getElementById('typeFilter').value = '';
                document.getElementById('vendorFilter').value = '';
                document.getElementById('minDiameter').value = '';
                document.getElementById('maxDiameter').value = '';
                document.getElementById('flutesFilter').value = '';
                if (document.getElementById('radiusFilter')) document.getElementById('radiusFilter').value = '';
                if (document.getElementById('pointAngleFilter')) document.getElementById('pointAngleFilter').value = '';
                document.getElementById('minGaugeLength').value = '';
                document.getElementById('maxGaugeLength').value = '';
                this.updateFilterVisibility();
                this.applyFilters();
            },

            sortBy(column) {
                if (this.sortColumn === column) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = column;
                    this.sortDirection = 'asc';
                }

                const config = this.columnConfigs[this.currentToolCategory] || this.columnConfigs.mixed;
                const columnConfig = config.find(c => c.key === column);

                this.filteredTools.sort((a, b) => {
                    let aVal, bVal;

                    if (columnConfig && columnConfig.isGeometry) {
                        aVal = a.geometry?.[column] || 0;
                        bVal = b.geometry?.[column] || 0;
                    } else {
                        aVal = a[column] || '';
                        bVal = b[column] || '';
                    }

                    if (typeof aVal === 'string') {
                        return this.sortDirection === 'asc' 
                            ? aVal.localeCompare(bVal)
                            : bVal.localeCompare(aVal);
                    } else {
                        return this.sortDirection === 'asc' 
                            ? aVal - bVal
                            : bVal - aVal;
                    }
                });

                this.updateSortIndicators();
                this.renderTable();
            },

            updateSortIndicators() {
                document.querySelectorAll('.sort-indicator').forEach(el => {
                    el.classList.remove('active');
                    el.textContent = '↕';
                });

                const indicator = document.querySelector(`[data-column="${this.sortColumn}"]`);
                if (indicator) {
                    indicator.classList.add('active');
                    indicator.textContent = this.sortDirection === 'asc' ? '↑' : '↓';
                }
            },

            renderTable() {
                const tbody = document.getElementById('tableBody');
                tbody.innerHTML = '';

                if (this.filteredTools.length === 0) {
                    tbody.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">No tools match the current filters.</div>';
                    return;
                }

                const config = this.columnConfigs[this.currentToolCategory] || this.columnConfigs.mixed;
                const gridTemplate = config.map(c => c.width).join(' ');

                this.filteredTools.forEach(tool => {
                    const row = document.createElement('div');
                    row.className = 'table-row';
                    row.style.gridTemplateColumns = gridTemplate;
                    row.onclick = () => this.selectTool(tool);
                    
                    const cells = config.map(col => {
                        let value;
                        if (col.isGeometry) {
                            value = tool.geometry?.[col.key];
                        } else {
                            value = tool[col.key];
                        }
                        
                        const formatted = col.key === 'description' 
                            ? (value || '—') 
                            : this.formatNumber(value);
                        
                        const cellClass = col.key === 'description' ? 'table-cell description' : 'table-cell';
                        return `<div class="${cellClass}">${formatted}</div>`;
                    }).join('');
                    
                    row.innerHTML = cells;
                    tbody.appendChild(row);
                });
            },

            selectTool(tool) {
                this.selectedTool = tool;
                
                // Update selection highlight
                document.querySelectorAll('.table-row').forEach(row => row.classList.remove('selected'));
                event.currentTarget.classList.add('selected');
                
                // Show detail panel
                const detailPanel = document.getElementById('detailPanel');
                detailPanel.classList.add('active');
                
                this.renderToolDetails(tool);
            },

            renderToolDetails(tool) {
                const detailPanel = document.getElementById('detailPanel');
                const geo = tool.geometry || {};
                const preset = tool['start-values']?.presets?.[0] || {};
                
                let detailsHTML = `
                    <div class="detail-header">
                        <div class="detail-title">${tool.type || 'Unknown Tool'}</div>
                        <div class="detail-product-id">Product ID: ${tool['product-id'] || '—'}</div>
                        ${tool['product-link'] ? `<a href="${tool['product-link']}" target="_blank" class="detail-link">View on Vendor Site ↗</a>` : ''}
                    </div>
                    
                    <div class="detail-content">
                        <div class="detail-section">
                            <div class="section-title">Description</div>
                            <p style="font-size: 0.85rem; line-height: 1.6; color: var(--text-primary);">${tool.description || '—'}</p>
                        </div>
                `;

                // Render geometry section for cutting tools
                if (tool.geometry) {
                    detailsHTML += `
                        <div class="detail-section">
                            <div class="section-title">Geometry</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Diameter (DC)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.DC)} ${tool.unit || 'in'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Shank Diameter</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.SFDM)} ${tool.unit || 'in'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Length of Cut (LOC)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.LCF)} ${tool.unit || 'in'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Overall Length (OAL)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.OAL)} ${tool.unit || 'in'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Number of Flutes</div>
                                    <div class="detail-item-value">${geo.NOF || '—'}</div>
                                </div>
                                ${tool.type === 'drill' ? `
                                <div class="detail-item">
                                    <div class="detail-item-label">Point Angle (SIG)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.SIG)}°</div>
                                </div>
                                ` : `
                                <div class="detail-item">
                                    <div class="detail-item-label">Corner Radius (RE)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.RE)} ${tool.unit || 'in'}</div>
                                </div>
                                `}
                                <div class="detail-item">
                                    <div class="detail-item-label">Gauge Length (LB)</div>
                                    <div class="detail-item-value">${this.formatNumber(geo.LB)} ${tool.unit || 'in'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Hand</div>
                                    <div class="detail-item-value">${geo.HAND ? 'Right' : 'Left'}</div>
                                </div>
                            </div>
                        </div>

                        <div class="detail-section">
                            <div class="section-title">Material & Coating</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Base Material</div>
                                    <div class="detail-item-value">${tool.BMC || '—'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Grade</div>
                                    <div class="detail-item-value">${tool.GRADE || '—'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Render holder-specific details
                if (tool.type === 'holder') {
                    detailsHTML += `
                        <div class="detail-section">
                            <div class="section-title">Holder Specifications</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Gauge Length</div>
                                    <div class="detail-item-value">${this.formatNumber(tool.gaugeLength)} ${tool.unit || 'mm'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Unit</div>
                                    <div class="detail-item-value">${tool.unit || '—'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Render preset if available
                if (preset.name) {
                    detailsHTML += `
                        <div class="detail-section">
                            <div class="section-title">Default Preset</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Cutting Speed (v_c)</div>
                                    <div class="detail-item-value">${this.formatNumber(preset.v_c)} ${tool.unit}/min</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Feed Rate (v_f)</div>
                                    <div class="detail-item-value">${this.formatNumber(preset.v_f)} ${tool.unit}/min</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Spindle Speed (n)</div>
                                    <div class="detail-item-value">${this.formatNumber(preset.n)} RPM</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Coolant</div>
                                    <div class="detail-item-value">${preset['tool-coolant'] || '—'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                // Render post-process if available
                if (tool['post-process']) {
                    detailsHTML += `
                        <div class="detail-section">
                            <div class="section-title">Post Process</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Tool Number</div>
                                    <div class="detail-item-value">${tool['post-process']?.number || 0}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Manual Change</div>
                                    <div class="detail-item-value">${tool['post-process']?.['manual-tool-change'] ? 'Yes' : 'No'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Break Control</div>
                                    <div class="detail-item-value">${tool['post-process']?.['break-control'] ? 'Yes' : 'No'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Live Tool</div>
                                    <div class="detail-item-value">${tool['post-process']?.live ? 'Yes' : 'No'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                }

                detailsHTML += `
                        <div class="detail-section">
                            <div class="section-title">Additional Info</div>
                            <div class="detail-grid">
                                <div class="detail-item">
                                    <div class="detail-item-label">Vendor</div>
                                    <div class="detail-item-value">${tool.vendor || '—'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">Unit</div>
                                    <div class="detail-item-value">${tool.unit || '—'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-item-label">GUID</div>
                                    <div class="detail-item-value" style="font-size: 0.7rem; word-break: break-all;">${tool.guid || '—'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                detailPanel.innerHTML = detailsHTML;
            },

            formatNumber(value) {
                if (value === undefined || value === null || value === 0) return '—';
                if (typeof value === 'number') {
                    return value.toFixed(4).replace(/\.?0+$/, '');
                }
                return value;
            }
        };

        // Initialize the app when DOM is ready
        document.addEventListener('DOMContentLoaded', () => app.init());
