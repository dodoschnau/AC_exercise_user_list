const BASE_URL = 'https://user-list.alphacamp.io/'
const INDEX_URL = BASE_URL + 'api/v1/users/'
const USERS_PER_PAGE = 20

const users = []
let filteredUsers = []

const dataPanel = document.querySelector('#data-panel')
const userModal = document.querySelector('#user-modal')
const searchForm = document.querySelector('#search-form')
const searchInput = document.querySelector('#search-input')
const paginator = document.querySelector('#paginator')
const favoriteLink = document.querySelector('#favorite-link')




let isFavoritePage = false //用於標識當前是否在favorite頁面
let currentPage = 1 //用於標識當前頁面



const favoriteList = JSON.parse(localStorage.getItem('favoriteUsers')) || []



function renderUserList(data) {
  let htmlContent = ''
  data.forEach(item => {
    let iconClass = 'fa-regular'
    if (favoriteList.some((user) => user.id === item.id)) {
      iconClass = 'fa-solid'
    }
    // 根據用戶是否在收藏列表中，如果有就是實心，沒有就是空心
    if (item.avatar !== null) {
      htmlContent += `
        <div class="card m-2 border-3 border-warning rounded" id="userCard" style="width: 15rem;">
          <div class="align-self-end m-3">
            <a class="btn btn-light border-2 border-danger rounded" id="favorite">
              <i class="${iconClass} fa-heart" style="color: #dc3545" data-id="${item.id}"></i>
            </a>
          </div>
          <img src="${item.avatar}" class="card-img-top img-fluid" data-bs-toggle="modal" data-bs-target="#user-modal" data-id="${item.id}" alt="user-avatar" class="card-img-top" id="user-img" alt="user-image">
          <div class="card-body flex-wrap d-flex justify-content-around">
            <h5 class="card-title mt-2 text-center align-content-center">${item.name + ' ' + item.surname}</h5>
          </div>

        </div>
      `
    }
  })
  dataPanel.innerHTML = htmlContent
}


function renderPaginator(amount) {
  const numbersOfPage = Math.ceil(amount / USERS_PER_PAGE)
  let htmlContent = ''
  for (let page = 1; page <= numbersOfPage; page++) {
    htmlContent += `<li class="page-item"><a class="page-link" href="#" id="number-of-paginator" data-page="${page}">${page}</a></li>`
  }
  paginator.innerHTML = htmlContent
}



function getUsersByPage(page) {
  // page 1 = users 0 - 19
  // page 2 = users 20 - 39
  // page 3 = users 40 - 59
  // 找出 startIndex / endIndex 規律 (endIndex不會顯示)
  const data = filteredUsers.length ? filteredUsers : users
  const startIndex = (page - 1) * USERS_PER_PAGE
  const endIndex = startIndex + USERS_PER_PAGE
  return data.slice(startIndex, endIndex)
}

axios.get(INDEX_URL).then((response) => {
  users.push(...response.data.results)
  renderPaginator(users.length)
  renderUserList(getUsersByPage(1))
})
  .catch((err) => { console.log(err) })


function showUserModal(id) {
  axios.get(INDEX_URL + id).then((response) => {
    const data = response.data
    const modalUserTitle = document.querySelector('#modal-user-title')
    const modalUserImg = document.querySelector('#modal-user-img')
    const modalUserInfo = document.querySelector('#modal-user-info')
    modalUserTitle.innerText = data.name + ' ' + data.surname
    modalUserImg.src = `${data.avatar}`
    modalUserInfo.innerHTML = `
      <li>${'Name : ' + data.name}</li>
      <li>${'Surname : ' + data.surname}</li>
      <li>${'Email : ' + data.email}</li>
      <li>${'Gender : ' + data.gender}</li>
      <li>${'Age : ' + data.age}</li>
      <li>${'Region : ' + data.region}</li>
    `
  })
}


function addToFavorite(id) {
  const user = users.find((user) => user.id === id)
  const inFavoriteUser = favoriteList.some((user) => user.id === id)

  if (inFavoriteUser) return // 如果已經在收藏清單裡，就停止以下動作

  favoriteList.push(user)
  localStorage.setItem('favoriteUsers', JSON.stringify(favoriteList))
}


function removeFromFavorite(id) {
  const favoriteUserIndex = favoriteList.findIndex((user) => user.id === id)
  favoriteList.splice(favoriteUserIndex, 1)
  localStorage.setItem('favoriteUsers', JSON.stringify(favoriteList))
  renderUserList(favoriteUsersByPage(currentPage))
}


function showFilteredUser(keyword) {
  filteredUsers = users.filter((user) => {
    const userFullName = user.name + user.surname
    return userFullName.toLowerCase().includes(keyword)
  })
  renderPaginator(filteredUsers.length)
  renderUserList(getUsersByPage(1))
}


function filteredFavoriteUsers(keyword) {
  filteredUsers = favoriteList.filter((user) => {
    const userFullName = user.name + user.surname
    return userFullName.toLowerCase().includes(keyword)
  })
  renderPaginator(filteredUsers.length)
  renderUserList(getUsersByPage(1))
}


function favoriteUsersPage(page) {
  const startIndex = (page - 1) * USERS_PER_PAGE
  const endIndex = startIndex + USERS_PER_PAGE
  return favoriteList.slice(startIndex, endIndex)
}


dataPanel.addEventListener('click', function onShowModalClicked(event) {
  if (event.target.matches('#user-img')) {
    showUserModal(Number(event.target.dataset.id))
    return  //在執行了showUserModal後直接返回，避免執行下面的代碼
  }

  const heartButton = event.target.closest('#favorite')
  // 只要是點擊#favorite以下的子元素（包含#favorite本身），都會回傳#favorite  
  const id = Number(heartButton.querySelector('i').dataset.id)
  // 在heartButton上面找到i，再找到i的dataset.id
  const heatIcon = heartButton.querySelector('i')

  if (heatIcon.classList.contains('fa-regular')) {
    heatIcon.classList.remove('fa-regular')
    heatIcon.classList.add('fa-solid')
    addToFavorite(id)
  } else if (heatIcon.classList.contains('fa-solid')) {
    heatIcon.classList.remove('fa-solid')
    heatIcon.classList.add('fa-regular')
    removeFromFavorite(id)
  }
})


paginator.addEventListener('click', function onPaginatorClicked(event) {
  if (event.target.tagName !== 'A') return
  const page = Number(event.target.dataset.page)
  currentPage = page
  if (isFavoritePage) {  // 如果是在favorite頁面的話，會是true
    renderUserList(favoriteUsersByPage(page))
  } else {
    renderUserList(getUsersByPage(page))
  }
})


searchForm.addEventListener('submit', function onSearchButtonSubmitted(event) {

  event.preventDefault()

  const originalKeyword = searchInput.value
  const keyword = searchInput.value.toLowerCase().trim()
  if (!keyword.length) {
    return alert('Please enter a valid string!')
  }

  showFilteredUser(keyword)

  if (!filteredUsers.length) {
    return alert(`Cannot find the user with keyword: ${originalKeyword}`)
  }
})


