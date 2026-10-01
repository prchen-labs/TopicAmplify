var PAGE_SIZE;
var activities;
var totalPage;
function createPagination() {
  PAGE_SIZE = 10; // 每页显示的项目数
  activities = document.querySelectorAll('.activity');
  const totalPage = Math.ceil(activities.length / PAGE_SIZE);
  let pagination = '';
  for (let i = 1; i <= totalPage; i++) {
    pagination += `<button class="page-btn" data-page="${i}">${i}</button>`;
  }
  const paginationContainer = document.createElement('div');
  paginationContainer.id = 'pagination';
  paginationContainer.innerHTML = pagination;
  const activityList = document.querySelector('.activity-list');
  activityList.insertAdjacentElement('afterend', paginationContainer);
  const pageBtns = document.querySelectorAll('.page-btn');
  pageBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const pageNum = parseInt(btn.dataset.page);
      const start = (pageNum - 1) * PAGE_SIZE;
      const end = pageNum * PAGE_SIZE;
      activities.forEach((activity, index) => {
        if (index >= start && index < end) {
          activity.style.display = 'flex';
        } else {
          activity.style.display = 'none';
        }
      });
      // 添加 "active" 類別
      pageBtns.forEach((btn) => {
        btn.classList.remove('active');
      });
      btn.classList.add('active');
    });
  });
  // 顯示第一頁的 activities
  if (totalPage > 0) {
    activities.forEach((activity, index) => {
      if (index >= 0 && index < PAGE_SIZE) {
        activity.style.display = 'flex';
      } else {
        activity.style.display = 'none';
      }
    });
    // 添加 "active" 類別
    pageBtns.forEach((btn) => {
      btn.classList.remove('active');
    });
    pageBtns[0].classList.add('active');
  }
}

window.onload = function() {
  createPagination();
};
