// js/evaluator-reports.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Evaluator Reports JS loaded');

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        return;
    }

    // Heartbeat
    function sendHeartbeat() {
        fetch('http://localhost:3000/api/user/heartbeat', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'x-auth-token': token }
        }).catch(() => {});
    }
    sendHeartbeat();
    setInterval(sendHeartbeat, 2 * 60 * 1000);

    // Load compliance report
    async function loadComplianceReport() {
        try {
            const response = await fetch('http://127.0.0.1:3000/api/documents/reports/compliance', {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const complianceData = await response.json();
            console.log('Compliance data:', complianceData);

            // Update summary cards
            updateComplianceSummary(complianceData);

            // Update department status
            updateDepartmentStatus(complianceData);

        } catch (error) {
            console.error('Error loading compliance report:', error);
        }
    }

    function updateComplianceSummary(data) {
        const colorMap = {
            'instruction': { text: 'text-blue-700', bg: 'bg-blue-600' },
            'research': { text: 'text-green-700', bg: 'bg-green-600' },
            'extension': { text: 'text-amber-700', bg: 'bg-amber-600' },
            'employment': { text: 'text-purple-700', bg: 'bg-purple-600' }
        };

        data.categories.forEach(cat => {
            const categoryName = cat.category_name;
            const colors = colorMap[categoryName] || { text: 'text-gray-700', bg: 'bg-gray-600' };
            
            // Find the card by category display name
            const cards = document.querySelectorAll('.stat-card');
            cards.forEach(card => {
                const heading = card.querySelector('h3');
                if (heading && heading.textContent.trim() === cat.category_display_name) {
                    // Update percentage
                    const percentElem = card.querySelector('.text-3xl');
                    if (percentElem) {
                        percentElem.textContent = `${cat.percentage}%`;
                        percentElem.className = `text-3xl font-bold ${colors.text} mb-2`;
                    }

                    // Update progress bar
                    const progressBar = card.querySelector('[class*="bg-"][class*="-600"]');
                    if (progressBar) {
                        progressBar.style.width = `${cat.percentage}%`;
                        progressBar.className = `${colors.bg} h-2 rounded-full`;
                    }

                    // Update document count
                    const countElem = card.querySelector('.text-gray-500');
                    if (countElem) countElem.textContent = `${cat.total_current}/${cat.total_expected} documents`;

                    // Update status
                    const statusElem = card.querySelector('.text-amber-600, .text-green-600');
                    if (statusElem) {
                        if (cat.percentage >= 100) {
                            statusElem.textContent = 'Complete';
                            statusElem.className = 'text-green-600';
                        } else {
                            statusElem.textContent = 'In Progress';
                            statusElem.className = 'text-amber-600';
                        }
                    }
                }
            });
        });
    }

    function updateDepartmentStatus(data) {
        // Update Instruction department status
        if (data.departments.instruction) {
            const instructionContainers = document.querySelectorAll('.bg-white.rounded-xl.p-5.stat-card h3');
            instructionContainers.forEach(heading => {
                if (heading.textContent.includes('Instruction Department Status')) {
                    const container = heading.closest('.stat-card').querySelector('.space-y-3');
                    if (container) {
                        container.innerHTML = data.departments.instruction.map((dept, index) => {
                            const statusColor = dept.status === 'complete' ? 'text-green-600' : 
                                              dept.status === 'partial' ? 'text-amber-600' : 'text-red-600';
                            const statusText = dept.status === 'complete' ? 'Complete' : 
                                             dept.status === 'partial' ? 'Partial' : 'Missing';
                            const borderClass = index < data.departments.instruction.length - 1 ? 'border-b border-gray-100' : '';
                            return `
                                <div class="dept-status-item flex justify-between items-center py-2 ${borderClass}">
                                    <span class="text-sm">${dept.department_code}</span>
                                    <span class="text-sm font-medium ${statusColor}">${statusText} (${dept.current}/${dept.expected})</span>
                                </div>
                            `;
                        }).join('');
                    }
                }
            });
        }

        // Update Research department status
        if (data.departments.research) {
            const researchContainers = document.querySelectorAll('.bg-white.rounded-xl.p-5.stat-card h3');
            researchContainers.forEach(heading => {
                if (heading.textContent.includes('Research Department Status')) {
                    const container = heading.closest('.stat-card').querySelector('.space-y-3');
                    if (container) {
                        container.innerHTML = data.departments.research.map((dept, index) => {
                            const statusColor = dept.status === 'complete' ? 'text-green-600' : 
                                              dept.status === 'partial' ? 'text-amber-600' : 'text-red-600';
                            const statusText = dept.status === 'complete' ? 'Complete' : 
                                             dept.status === 'partial' ? 'Partial' : 'Missing';
                            const borderClass = index < data.departments.research.length - 1 ? 'border-b border-gray-100' : '';
                            return `
                                <div class="dept-status-item flex justify-between items-center py-2 ${borderClass}">
                                    <span class="text-sm">${dept.department_code}</span>
                                    <span class="text-sm font-medium ${statusColor}">${statusText} (${dept.current}/${dept.expected})</span>
                                </div>
                            `;
                        }).join('');
                    }
                }
            });
        }

        // Update Extension department status
        if (data.departments.extension) {
            const extensionContainers = document.querySelectorAll('.bg-white.rounded-xl.p-5.stat-card h3');
            extensionContainers.forEach(heading => {
                if (heading.textContent.includes('Extension Department Status')) {
                    const container = heading.closest('.stat-card').querySelector('.space-y-3');
                    if (container) {
                        container.innerHTML = data.departments.extension.map((dept, index) => {
                            const statusColor = dept.status === 'complete' ? 'text-green-600' : 
                                              dept.status === 'partial' ? 'text-amber-600' : 'text-red-600';
                            const statusText = dept.status === 'complete' ? 'Complete' : 
                                             dept.status === 'partial' ? 'Partial' : 'Missing';
                            const borderClass = index < data.departments.extension.length - 1 ? 'border-b border-gray-100' : '';
                            return `
                                <div class="dept-status-item flex justify-between items-center py-2 ${borderClass}">
                                    <span class="text-sm">${dept.department_code}</span>
                                    <span class="text-sm font-medium ${statusColor}">${statusText} (${dept.current}/${dept.expected})</span>
                                </div>
                            `;
                        }).join('');
                    }
                }
            });
        }

        // Update Employment department status
        if (data.departments.employment) {
            const employmentContainers = document.querySelectorAll('.bg-white.rounded-xl.p-5.stat-card h3');
            employmentContainers.forEach(heading => {
                if (heading.textContent.includes('Employment Department Status')) {
                    const container = heading.closest('.stat-card').querySelector('.space-y-3');
                    if (container) {
                        container.innerHTML = data.departments.employment.map((dept, index) => {
                            const statusColor = dept.status === 'complete' ? 'text-green-600' : 
                                              dept.status === 'partial' ? 'text-amber-600' : 'text-red-600';
                            const statusText = dept.status === 'complete' ? 'Complete' : 
                                             dept.status === 'partial' ? 'Partial' : 'Missing';
                            const borderClass = index < data.departments.employment.length - 1 ? 'border-b border-gray-100' : '';
                            return `
                                <div class="dept-status-item flex justify-between items-center py-2 ${borderClass}">
                                    <span class="text-sm">${dept.department_code}</span>
                                    <span class="text-sm font-medium ${statusColor}">${statusText} (${dept.current}/${dept.expected})</span>
                                </div>
                            `;
                        }).join('');
                    }
                }
            });
        }
    }

    // Load gap analysis
    async function loadGapAnalysis() {
        try {
            const response = await fetch('http://127.0.0.1:3000/api/documents/reports/gap-analysis', {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const gapData = await response.json();
            console.log('Gap analysis data:', gapData);

            // Update gap analysis tab
            updateGapAnalysis(gapData);

        } catch (error) {
            console.error('Error loading gap analysis:', error);
        }
    }

    function updateGapAnalysis(gapData) {
        const gapContainer = document.querySelector('#gapTab .space-y-6');
        if (!gapContainer) return;

        gapContainer.innerHTML = '';

        const colorMap = {
            'instruction': 'blue',
            'research': 'green',
            'extension': 'amber',
            'employment': 'purple'
        };

        Object.keys(gapData).forEach(categoryName => {
            const category = gapData[categoryName];
            const color = colorMap[categoryName] || 'gray';

            const categorySection = document.createElement('div');
            categorySection.innerHTML = `
                <h4 class="font-medium mb-2 text-${color}-700">${category.category_display_name} Gaps</h4>
                ${category.gaps.map(gap => `
                    <div class="gap-item bg-red-50 border border-red-200 rounded-lg p-3 mb-2">
                        <div class="flex items-start gap-2">
                            <span class="text-red-600 font-bold">!</span>
                            <div>
                                <span class="font-medium text-sm">${gap.department_code} - ${gap.department_name}</span>
                                <p class="text-xs text-gray-600 mt-1">Missing ${gap.missing} documents (${gap.current}/${gap.expected})</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            `;
            gapContainer.appendChild(categorySection);
        });

        if (Object.keys(gapData).length === 0) {
            gapContainer.innerHTML = '<p class="text-center text-gray-500 py-8">No gaps found. All requirements are met!</p>';
        }
    }

    // Load progress reports (monthly/quarterly data)
    async function loadProgressReports() {
        try {
            const response = await fetch('http://127.0.0.1:3000/api/documents/reports/monthly-progress', {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Monthly progress data:', data);

            updateProgressReports(data);

        } catch (error) {
            console.error('Error loading progress reports:', error);
        }
    }

    function updateProgressReports(data) {
        const progressContainer = document.querySelector('#progressTab .grid');
        if (!progressContainer || !data.monthly_reports) return;

        progressContainer.innerHTML = '';

        if (data.monthly_reports.length === 0) {
            progressContainer.innerHTML = '<div class="col-span-full"><p class="text-center text-gray-500 py-8">No monthly reports available yet</p></div>';
            return;
        }

        // Get current month in YYYY-MM format
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

        data.monthly_reports.forEach((monthData, index) => {
            const monthDisplay = monthData.month_display;
            const totalUploaded = monthData.total_uploaded || 0;
            const approved = monthData.approved || 0;
            const pending = monthData.pending || 0;
            const rejected = monthData.rejected || 0;
            const isCurrentMonth = monthData.month === currentMonth;
            
            // Calculate approval rate
            const approvalRate = totalUploaded > 0 ? Math.round((approved / totalUploaded) * 100) : 0;
            
            // Badge color - current month is teal with pulse animation, others are gray
            const badgeColor = isCurrentMonth ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-800';
            const cardBorder = isCurrentMonth ? 'border-teal-300 shadow-md' : 'border-gray-200';
            
            // Create stat card for each month
            const monthCard = document.createElement('div');
            monthCard.className = `bg-white rounded-xl p-5 border-2 ${cardBorder} hover:shadow-md transition`;
            monthCard.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="${badgeColor} text-xs px-2 py-1 rounded-full font-medium">${monthDisplay}</span>
                            ${isCurrentMonth ? '<span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span></span>' : ''}
                        </div>
                        <h4 class="font-semibold text-gray-800 mt-2">Monthly Progress Report</h4>
                        ${isCurrentMonth ? '<p class="text-xs text-teal-600 font-medium mt-1">In Progress</p>' : ''}
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-teal-700">${approvalRate}%</div>
                        <div class="text-xs text-gray-500">Approval Rate</div>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-3 mt-4">
                    <div class="text-center p-3 bg-blue-50 rounded-lg">
                        <div class="text-xl font-bold text-blue-700">${totalUploaded}</div>
                        <div class="text-xs text-gray-600 mt-1">Total Uploaded</div>
                    </div>
                    <div class="text-center p-3 bg-green-50 rounded-lg">
                        <div class="text-xl font-bold text-green-700">${approved}</div>
                        <div class="text-xs text-gray-600 mt-1">Approved</div>
                    </div>
                    <div class="text-center p-3 bg-amber-50 rounded-lg">
                        <div class="text-xl font-bold text-amber-700">${pending}</div>
                        <div class="text-xs text-gray-600 mt-1">Pending</div>
                    </div>
                </div>
                
                ${rejected > 0 ? `
                <div class="mt-3 p-2 bg-red-50 rounded-lg text-center">
                    <span class="text-sm font-medium text-red-700">${rejected} Rejected</span>
                </div>
                ` : ''}
            `;
            
            progressContainer.appendChild(monthCard);
        });
    }

    // Load historical data
    async function loadHistoricalData() {
        try {
            const response = await fetch('http://127.0.0.1:3000/api/documents/reports/compliance', {
                method: 'GET',
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const complianceData = await response.json();
            
            // Calculate overall compliance
            const totalCurrent = complianceData.categories.reduce((sum, cat) => sum + cat.total_current, 0);
            const totalExpected = complianceData.categories.reduce((sum, cat) => sum + cat.total_expected, 0);
            const overallPercentage = totalExpected > 0 ? Math.round((totalCurrent / totalExpected) * 100) : 0;

            updateHistoricalData(overallPercentage);

        } catch (error) {
            console.error('Error loading historical data:', error);
        }
    }

    function updateHistoricalData(currentPercentage) {
        const historyContainer = document.querySelector('#historyTab .space-y-4');
        if (!historyContainer) return;

        const currentYear = new Date().getFullYear();
        
        historyContainer.innerHTML = `
            <div class="history-item border-l-4 border-teal-500 pl-4 py-2">
                <div class="text-sm text-gray-500">${currentYear}</div>
                <div class="text-lg font-semibold">${currentPercentage}% Overall Compliance</div>
                <div class="text-xs text-gray-500">Current year progress</div>
            </div>
            
            <div class="history-item border-l-4 border-amber-500 pl-4 py-2">
                <div class="text-sm text-gray-500">${currentYear - 1}</div>
                <div class="text-lg font-semibold">Historical data not available</div>
                <div class="text-xs text-gray-500">Previous year data</div>
            </div>
            
            <div class="history-item border-l-4 border-indigo-500 pl-4 py-2">
                <div class="text-sm text-gray-500">${currentYear - 2}</div>
                <div class="text-lg font-semibold">Historical data not available</div>
                <div class="text-xs text-gray-500">Previous year data</div>
            </div>
        `;
    }

    // Tab switching with data loading
    document.querySelectorAll('#reportTabs a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const tabId = this.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('#reportTabs a').forEach(l => {
                l.classList.remove('active-tab', 'border-teal-600', 'text-teal-700');
                l.classList.add('border-transparent', 'text-gray-500');
            });
            this.classList.add('active-tab', 'border-teal-600', 'text-teal-700');
            
            // Show selected tab
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            document.getElementById(tabId + 'Tab').classList.remove('hidden');

            // Load data for specific tabs
            if (tabId === 'gap') {
                loadGapAnalysis();
            } else if (tabId === 'progress') {
                loadProgressReports();
            }
        });
    });

    // Load initial data (compliance summary)
    loadComplianceReport();

    console.log('Reports loaded in view-only mode');
});
