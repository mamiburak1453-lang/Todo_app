// MODERN YAPILACAKLAR LİSTESİ UYGULAMASI
class TodoApp {
    constructor() {
        this.tasks = [];
        this.lists = [
            { id: 1, name: 'Genel', color: '#3498db', taskCount: 0 },
            { id: 2, name: 'İş', color: '#e74c3c', taskCount: 0 },
            { id: 3, name: 'Kişisel', color: '#2ecc71', taskCount: 0 }
        ];
        this.currentListId = 1;
        this.editingTask = null;
        this.selectedColor = '#3498db';
        
        this.initializeApp();
        this.loadFromLocalStorage();
        this.updateUI();
    }

    initializeApp() {
        // DOM ELEMENTLERİ
        this.elements = {
            taskInput: document.getElementById('taskInput'),
            prioritySelect: document.getElementById('prioritySelect'),
            dueDateInput: document.getElementById('dueDateInput'),
            addTaskBtn: document.getElementById('addTaskBtn'),
            tasksList: document.getElementById('tasksList'),
            listsContainer: document.getElementById('listsContainer'),
            currentListTitle: document.getElementById('currentListTitle'),
            totalTasks: document.getElementById('totalTasks'),
            completedTasks: document.getElementById('completedTasks'),
            pendingTasks: document.getElementById('pendingTasks'),
            emptyState: document.getElementById('emptyState'),
            addListBtn: document.getElementById('addListBtn'),
            listModal: document.getElementById('listModal'),
            taskModal: document.getElementById('taskModal'),
            newListName: document.getElementById('newListName'),
            saveListBtn: document.getElementById('saveListBtn'),
            cancelListBtn: document.getElementById('cancelListBtn'),
            clearCompletedBtn: document.getElementById('clearCompletedBtn'),
            sortTasksBtn: document.getElementById('sortTasksBtn'),
            notification: document.getElementById('notification'),
            notificationText: document.getElementById('notificationText')
        };

        // EVENT LISTENER'LAR
        this.bindEvents();
        this.renderLists();
    }

    bindEvents() {
        // GÖREV EKLEME
        this.elements.addTaskBtn.addEventListener('click', () => this.addTask());
        this.elements.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });

        // LİSTE İŞLEMLERİ
        this.elements.addListBtn.addEventListener('click', () => this.showListModal());
        this.elements.saveListBtn.addEventListener('click', () => this.saveNewList());
        this.elements.cancelListBtn.addEventListener('click', () => this.hideListModal());

        // DİĞER İŞLEMLER
        this.elements.clearCompletedBtn.addEventListener('click', () => this.clearCompletedTasks());
        this.elements.sortTasksBtn.addEventListener('click', () => this.sortTasks());

        // MODAL KAPATMA
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.modal').classList.remove('show');
            });
        });

        // RENK SEÇİCİ
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', (e) => {
                document.querySelectorAll('.color-option').forEach(opt => 
                    opt.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedColor = e.target.dataset.color;
            });
        });

        // DIŞARI TIKLAYINCA MODAL KAPATMA
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });

        // HATIRLATICI SİSTEMİ
        setInterval(() => this.checkReminders(), 60000); // Her dakika kontrol et
    }

    // GÖREV EKLEME
    addTask() {
        const title = this.elements.taskInput.value.trim();
        if (!title) {
            this.showNotification('Lütfen görev başlığı girin!', 'error');
            return;
        }

        const task = {
            id: Date.now(),
            title: title,
            listId: this.currentListId,
            priority: this.elements.prioritySelect.value,
            dueDate: this.elements.dueDateInput.value ? new Date(this.elements.dueDateInput.value) : null,
            completed: false,
            createdAt: new Date(),
            description: ''
        };

        this.tasks.push(task);
        this.elements.taskInput.value = '';
        this.elements.dueDateInput.value = '';
        
        this.saveToLocalStorage();
        this.updateUI();
        this.showNotification('Görev başarıyla eklendi!', 'success');
        
        // ANİMASYON
        this.animateNewTask(task.id);
    }

    // GÖREV SİLME
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveToLocalStorage();
        this.updateUI();
        this.showNotification('Görev silindi!', 'success');
    }

    // GÖREV TAMAMLAMA
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveToLocalStorage();
            this.updateUI();
            
            const status = task.completed ? 'tamamlandı' : 'beklemede';
            this.showNotification(`Görev "${status}" olarak işaretlendi!`, 'success');
            
            // ANİMASYON
            this.animateTaskCompletion(taskId);
        }
    }

    // LİSTE EKLEME
    saveNewList() {
        const listName = this.elements.newListName.value.trim();
        if (!listName) {
            this.showNotification('Lütfen liste adı girin!', 'error');
            return;
        }

        if (this.lists.some(list => list.name.toLowerCase() === listName.toLowerCase())) {
            this.showNotification('Bu isimde bir liste zaten var!', 'error');
            return;
        }

        const newList = {
            id: Date.now(),
            name: listName,
            color: this.selectedColor,
            taskCount: 0
        };

        this.lists.push(newList);
        this.hideListModal();
        this.renderLists();
        this.saveToLocalStorage();
        this.showNotification('Yeni liste eklendi!', 'success');
    }

    // LİSTE DEĞİŞTİRME
    switchList(listId) {
        this.currentListId = listId;
        this.updateUI();
        this.animateListSwitch();
    }

    // TAMAMLANAN GÖREVLERİ TEMİZLE
    clearCompletedTasks() {
        const completedCount = this.tasks.filter(task => 
            task.listId === this.currentListId && task.completed
        ).length;

        if (completedCount === 0) {
            this.showNotification('Tamamlanan görev bulunamadı!', 'warning');
            return;
        }

        if (confirm(`${completedCount} tamamlanmış görevi silmek istediğinizden emin misiniz?`)) {
            this.tasks = this.tasks.filter(task => 
                !(task.listId === this.currentListId && task.completed)
            );
            this.saveToLocalStorage();
            this.updateUI();
            this.showNotification('Tamamlanan görevler temizlendi!', 'success');
        }
    }

    // GÖREVLERİ SIRALA
    sortTasks() {
        const currentTasks = this.tasks.filter(task => task.listId === this.currentListId);
        
        currentTasks.sort((a, b) => {
            // Önceliğe göre sırala (Yüksek > Orta > Düşük)
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            
            if (priorityDiff !== 0) return priorityDiff;
            
            // Tarihe göre sırala
            if (a.dueDate && b.dueDate) {
                return new Date(a.dueDate) - new Date(b.dueDate);
            }
            if (a.dueDate) return -1;
            if (b.dueDate) return 1;
            
            // Oluşturulma tarihine göre sırala
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Sıralanmış görevleri güncelle
        const otherTasks = this.tasks.filter(task => task.listId !== this.currentListId);
        this.tasks = [...otherTasks, ...currentTasks];
        
        this.saveToLocalStorage();
        this.updateUI();
        this.showNotification('Görevler önceliğe göre sıralandı!', 'success');
    }

    // HATIRLATICI KONTROLÜ
    checkReminders() {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        this.tasks.forEach(task => {
            if (task.dueDate && !task.completed) {
                const dueDate = new Date(task.dueDate);
                if (dueDate > now && dueDate <= oneHourLater) {
                    this.showNotification(
                        `⏰ "${task.title}" görevi için son tarih yaklaşıyor!`,
                        'warning'
                    );
                }
            }
        });
    }

    // UI GÜNCELLEME
    updateUI() {
        this.renderTasks();
        this.renderLists();
        this.updateStatistics();
        this.updateCurrentListTitle();
        this.toggleEmptyState();
    }

    // GÖREVLERİ RENDER ET
    renderTasks() {
        const currentTasks = this.tasks.filter(task => task.listId === this.currentListId);
        
        this.elements.tasksList.innerHTML = currentTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                     onclick="app.toggleTaskCompletion(${task.id})">
                    ${task.completed ? '✓' : ''}
                </div>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    <div class="task-meta">
                        <span class="task-priority priority-${task.priority}">
                            ${this.getPriorityText(task.priority)}
                        </span>
                        ${task.dueDate ? `
                            <span class="task-due-date">
                                <i class="far fa-clock"></i>
                                ${this.formatDate(new Date(task.dueDate))}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-icon" onclick="app.editTask(${task.id})" title="Düzenle">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon" onclick="app.deleteTask(${task.id})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // LİSTELERİ RENDER ET
    renderLists() {
        this.elements.listsContainer.innerHTML = this.lists.map(list => {
            const taskCount = this.tasks.filter(task => 
                task.listId === list.id && !task.completed
            ).length;
            
            return `
                <li class="list-item ${list.id === this.currentListId ? 'active' : ''}" 
                    onclick="app.switchList(${list.id})"
                    style="border-left-color: ${list.color}">
                    <span>
                        <i class="fas fa-list"></i>
                        ${this.escapeHtml(list.name)}
                    </span>
                    <span class="list-count">${taskCount}</span>
                </li>
            `;
        }).join('');
    }

    // İSTATİSTİKLERİ GÜNCELLE
    updateStatistics() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const pendingTasks = totalTasks - completedTasks;

        this.elements.totalTasks.textContent = totalTasks;
        this.elements.completedTasks.textContent = completedTasks;
        this.elements.pendingTasks.textContent = pendingTasks;
    }

    // MEVCUT LİSTE BAŞLIĞINI GÜNCELLE
    updateCurrentListTitle() {
        const currentList = this.lists.find(list => list.id === this.currentListId);
        if (currentList) {
            this.elements.currentListTitle.textContent = `${currentList.name} Listesi`;
        }
    }

    // BOŞ DURUM GÖSTER/GİZLE
    toggleEmptyState() {
        const hasTasks = this.tasks.some(task => task.listId === this.currentListId);
        this.elements.emptyState.style.display = hasTasks ? 'none' : 'block';
        this.elements.tasksList.style.display = hasTasks ? 'block' : 'none';
    }

    // MODAL İŞLEMLERİ
    showListModal() {
        this.elements.newListName.value = '';
        this.selectedColor = '#3498db';
        document.querySelectorAll('.color-option').forEach(opt => 
            opt.classList.remove('selected'));
        document.querySelector('.color-option').classList.add('selected');
        this.elements.listModal.classList.add('show');
        this.elements.newListName.focus();
    }

    hideListModal() {
        this.elements.listModal.classList.remove('show');
    }

    // BİLDİRİM GÖSTER
    showNotification(message, type = 'success') {
        this.elements.notificationText.textContent = message;
        this.elements.notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            this.elements.notification.classList.remove('show');
        }, 3000);
    }

    // ANİMASYONLAR
    animateNewTask(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.style.animation = 'taskAppear 0.3s ease-out';
        }
    }

    animateTaskCompletion(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                taskElement.style.transform = 'scale(1)';
            }, 300);
        }
    }

    animateListSwitch() {
        const tasksSection = document.querySelector('.tasks-section');
        tasksSection.style.animation = 'none';
        setTimeout(() => {
            tasksSection.style.animation = 'slideUp 0.6s ease-out';
        }, 10);
    }

    // YARDIMCI FONKSİYONLAR
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    getPriorityText(priority) {
        const texts = {
            high: '🔴 Yüksek',
            medium: '🟡 Orta', 
            low: '🟢 Düşük'
        };
        return texts[priority] || '🟡 Orta';
    }

    // LOCAL STORAGE
    saveToLocalStorage() {
        const data = {
            tasks: this.tasks,
            lists: this.lists,
            currentListId: this.currentListId
        };
        localStorage.setItem('todoApp', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('todoApp');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.tasks = data.tasks || [];
                this.lists = data.lists || this.lists;
                this.currentListId = data.currentListId || 1;
                
                // Tarih nesnelerini geri yükle
                this.tasks.forEach(task => {
                    if (task.dueDate) task.dueDate = new Date(task.dueDate);
                    if (task.createdAt) task.createdAt = new Date(task.createdAt);
                });
            } catch (e) {
                console.error('Veri yükleme hatası:', e);
            }
        }
    }
}

// GÖREV DÜZENLEME FONKSİYONLARI (Basit versiyon)
TodoApp.prototype.editTask = function(taskId) {
    this.showNotification('Görev düzenleme özelliği pro versiyonda mevcut!', 'warning');
};

// UYGULAMAYI BAŞLAT
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new TodoApp();
    
    // SAYFA YÜKLENDİĞİNDE ANİMASYON
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease-in';
        document.body.style.opacity = '1';
    }, 100);
});

// OFFLINE DESTEĞİ
window.addEventListener('online', () => {
    app.showNotification('İnternet bağlantısı yenilendi!', 'success');
});

window.addEventListener('offline', () => {
    app.showNotification('İnternet bağlantısı kesildi! Çevrimdışı moda geçildi.', 'warning');
});

// UZAY YILDIZLARI OLUŞTURMA
function createStars() {
    const starsContainer = document.createElement('div');
    starsContainer.className = 'stars-container';
    starsContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    `;
    
    document.body.appendChild(starsContainer);
    
    // YILDIZ SAYISI
    const starCount = 150;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // RASTGELE BOYUT (1-3px)
        const size = Math.random() * 2 + 1;
        
        // RASTGELE POZİSYON
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        
        // RASTGELE OPACITY
        const opacity = Math.random() * 0.7 + 0.3;
        
        // RASTGELE ANİMASYON SÜRESİ
        const duration = Math.random() * 3 + 2;
        
        star.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: white;
            border-radius: 50%;
            left: ${left}%;
            top: ${top}%;
            opacity: ${opacity};
            animation: twinkle ${duration}s infinite;
            box-shadow: 0 0 ${size * 2}px white;
        `;
        
        // RASTGELE ANİMASYON GECİKMESİ
        const delay = Math.random() * 5;
        star.style.animationDelay = `${delay}s`;
        
        starsContainer.appendChild(star);
    }
}

// YILDIZ ANİMASYONU İÇİN CSS EKLEYELİM
function addStarAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes twinkle {
            0%, 100% { 
                opacity: 0.2; 
                transform: scale(1);
            }
            50% { 
                opacity: 1; 
                transform: scale(1.2);
            }
        }
        
        /* Büyük yıldızlar için farklı animasyon */
        .star:nth-child(5n) {
            animation-duration: 4s;
        }
        
        .star:nth-child(7n) {
            animation-duration: 6s;
        }
        
        /* Renkli yıldızlar */
        .star:nth-child(3n) {
            background: #A78BFA;
            box-shadow: 0 0 6px #A78BFA;
        }
        
        .star:nth-child(5n) {
            background: #8B5CF6;
            box-shadow: 0 0 8px #8B5CF6;
        }
        
        .star:nth-child(7n) {
            background: #C4B5FD;
            box-shadow: 0 0 4px #C4B5FD;
        }
        
        /* Gezegen efekti için büyük yıldız */
        .star.planet {
            width: 6px !important;
            height: 6px !important;
            background: radial-gradient(circle, #8B5CF6, #A78BFA);
            box-shadow: 0 0 20px #8B5CF6;
            animation: planetGlow 8s infinite;
        }
        
        @keyframes planetGlow {
            0%, 100% { 
                opacity: 0.3; 
                transform: scale(1);
            }
            50% { 
                opacity: 0.8; 
                transform: scale(1.1);
            }
        }
        
        /* Hareketli yıldızlar */
        .star.moving {
            animation: moveStar 20s linear infinite, twinkle 3s infinite;
        }
        
        @keyframes moveStar {
            0% { transform: translateX(0) translateY(0); }
            25% { transform: translateX(100px) translateY(50px); }
            50% { transform: translateX(200px) translateY(0); }
            75% { transform: translateX(100px) translateY(-50px); }
            100% { transform: translateX(0) translateY(0); }
        }
    `;
    document.head.appendChild(style);
}

// SAYFA YÜKLENDİĞİNDE YILDIZLARI OLUŞTUR
document.addEventListener('DOMContentLoaded', () => {
    addStarAnimations();
    createStars();
    
    // BİRAZ DAHA ÖZEL YILDIZLAR EKLEYELİM
    setTimeout(() => {
        addSpecialStars();
    }, 1000);
});

// ÖZEL YILDIZLAR EKLEME
function addSpecialStars() {
    const starsContainer = document.querySelector('.stars-container');
    
    // BİRKAÇ BÜYÜK YILDIZ (GEZEGEN GİBİ)
    for (let i = 0; i < 3; i++) {
        const planet = document.createElement('div');
        planet.className = 'star planet';
        
        planet.style.cssText = `
            position: absolute;
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, #8B5CF6, #A78BFA);
            border-radius: 50%;
            left: ${Math.random() * 80 + 10}%;
            top: ${Math.random() * 80 + 10}%;
            opacity: 0.5;
            animation: planetGlow 8s infinite;
            box-shadow: 0 0 20px #8B5CF6;
            z-index: 1;
        `;
        
        starsContainer.appendChild(planet);
    }
    
    // HAREKETLİ YILDIZLAR (METEOR)
    for (let i = 0; i < 2; i++) {
        const shootingStar = document.createElement('div');
        shootingStar.className = 'star moving';
        
        shootingStar.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            left: ${Math.random() * 50}%;
            top: ${Math.random() * 50}%;
            opacity: 0.8;
            animation: moveStar 15s linear infinite, twinkle 2s infinite;
            box-shadow: 0 0 10px white;
        `;
        
        starsContainer.appendChild(shootingStar);
    }
}

// MOUSE HAREKETİNE TEPKİ VEREN YILDIZLAR
document.addEventListener('mousemove', (e) => {
    const stars = document.querySelectorAll('.star:not(.planet):not(.moving)');
    const mouseX = e.clientX / window.innerWidth;
    const mouseY = e.clientY / window.innerHeight;
    
    stars.forEach((star, index) => {
        const starX = parseFloat(star.style.left) / 100;
        const starY = parseFloat(star.style.top) / 100;
        
        const distance = Math.sqrt(
            Math.pow(mouseX - starX, 2) + Math.pow(mouseY - starY, 2)
        );
        
        if (distance < 0.1) {
            star.style.transform = 'scale(1.5)';
            star.style.opacity = '1';
            star.style.transition = 'all 0.3s ease';
        } else {
            star.style.transform = 'scale(1)';
            star.style.opacity = star.style.opacity;
            star.style.transition = 'all 0.5s ease';
        }
    });
});