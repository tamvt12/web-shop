$(document).ready(function () {
  $('#profileForm').on('submit', function (event) {
    event.preventDefault()

    const phoneValue = $('#phone').val().trim()

    if (isNaN(phoneValue)) {
      $('#errorAlert').addClass('alert-danger')
      $('#errorAlert').removeClass('alert-success')
      $('#errorAlert')
        .text('Số điện thoại phải là dạng số. VD: 0123456789')
        .show()
      return
    }

    $.ajax({
      url: '/update',
      type: 'POST',
      data: $(this).serialize(),
      dataType: 'json',
      success: function (data) {
        if (data.success) {
          $('#errorAlert').addClass('alert-success')
          $('#errorAlert').removeClass('alert-danger')
          $('#errorAlert').text(data.message).show()
        } else {
          $('#errorAlert').addClass('alert-danger')
          $('#errorAlert').removeClass('alert-success')
          $('#errorAlert').text(data.message).show()
        }
      },
      error: function (xhr, status, error) {
        alert('Đã có lỗi xảy ra. Vui lòng thử lại sau.')
      },
    })
  })
})

$('#upload').change(function () {
  const formData = new FormData()
  formData.append('image', this.files[0])

  $.ajax({
    url: '/admin/product/upload-image',
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: function (results) {
      console.log(results)
      if (results.success) {
        $('#image_show').html(
          `<a href="${results.imageUrl}" target="_blank">
						<img src="${results.imageUrl}" width="100px">
					</a>`,
        )
        $('#thumb').val(results.imageUrl)
      } else {
        alert(results.message)
      }
    },
    error: function (xhr, status, error) {
      const errorMessage = xhr.responseJSON
        ? xhr.responseJSON.message
        : 'Lỗi không xác định'
      alert(errorMessage)
    },
  })
})

function removeRow(url) {
  if (confirm('Xóa mà không thể khôi phục. Bạn có chắc ?')) {
    $.ajax({
      processData: false,
      contentType: false,
      type: 'DELETE',
      dateType: 'json',
      url: url,
      success: function (results) {
        alert(results.message)
        if (results.success === true) {
          location.reload()
        }
      },
    })
  }
}

function addCart(id) {
  $.ajax({
    url: '/addCart',
    type: 'POST',
    data: { id: id },
    success: function (results) {
      if (results.error === 'Unauthorized') {
        window.location.href = '/login'
      } else {
        if (results.message !== '') {
          alert(results.message)
        }
        $('#cartCount').text(results.cartCount)
        $('#orderCount').text(results.orderCount)
      }
    },
    error: function (xhr, status, error) {
      console.error('Lỗi khi gửi dữ liệu:', error)
      console.log('Phản hồi từ server:', xhr.responseText)
    },
  })
}

function buyCart(id) {
  $.ajax({
    url: '/addCart',
    type: 'POST',
    data: { id: id },
    success: function (response) {
      if (response.error === 'Unauthorized') {
        window.location.href = '/login'
      } else {
        if (response.message !== '') {
          alert(response.message)
        } else {
          $('#cartCount').text(response.cartCount)
          $('#orderCount').text(response.orderCount)
          window.location.href = '/cart'
        }
      }
    },
  })
}

function updateMainImage(thumbnail) {
  document.querySelectorAll('.image-thumbnails img').forEach((img) => {
    img.classList.remove('active')
  })
  thumbnail.classList.add('active')
  document.querySelector('.main-image img').src = thumbnail.src
}

function incrementQuantity() {
  const input = document.getElementById('quantity')
  input.value = parseInt(input.value) + 1
}

function decrementQuantity() {
  const input = document.getElementById('quantity')
  if (parseInt(input.value) > 1) {
    input.value = parseInt(input.value) - 1
  }
}

function addToCart(productId) {
  const quantity = document.getElementById('quantity').value
  fetch('/addCart', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: productId,
      quantity: parseInt(quantity),
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error)
      } else {
        if (data.message) {
          alert(data.message)
        }
        if (data.cartCount !== undefined) {
          document.getElementById('cartCount').textContent = data.cartCount
        }
      }
    })
    .catch((error) => {
      console.error('Error:', error)
      alert('Có lỗi xảy ra khi thêm vào giỏ hàng')
    })
}

function buyNow(productId) {
  const quantity = document.getElementById('quantity').value
  fetch('/buyNow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: productId,
      quantity: parseInt(quantity),
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error)
      } else {
        if (data.message) {
          alert(data.message)
        }
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl
        }
      }
    })
    .catch((error) => {
      console.error('Error:', error)
      alert('Có lỗi xảy ra khi xử lý mua ngay')
    })
}

function loadCartItems(cartItems) {
  console.log(cartItems)
  let total = 0
  $('#cart-items').empty()
  if (cartItems.length === 0) {
    $('#cart-total-price').text(formatCurrency(total))
    return
  }
  cartItems.forEach((item) => {
    console.log(item)
    const itemTotal = item.product.price.$numberDecimal * item.quantity
    total += itemTotal
    $('#cart-items').append(`
            <tr class="cart-item">
                <td>
					<img src="${item.product.image_url}" alt="${item.product.name}">
				</td>
                <td>${item.product.name}</td>
                <td class="text-danger">${formatCurrency(
                  item.product.price.$numberDecimal,
                )}</td>
                <td>
                    <div class="quantity-controls">
                        <button class="btn btn-sm btn-primary" onclick="updateQuantity('${
                          item._id
                        }', ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn btn-sm btn-primary" onclick="updateQuantity('${
                          item._id
                        }', ${item.quantity + 1})">+</button>
                    </div>
                </td>
                <td class="text-danger">${formatCurrency(itemTotal)}</td>
                <td><button class="btn btn-danger" onclick="removeItem('${
                  item._id
                }')">Xóa</button></td>
            </tr>
        `)
  })
  $('#cart-total-price').text(formatCurrency(total))
}

function removeItem(itemId) {
  $.ajax({
    processData: false,
    contentType: false,
    url: '/deleteCart/' + itemId,
    type: 'DELETE',
    success: function (response) {
      loadCartItems(response.cart_items)
      $('#cartCount').text(response.cartCount)
      $('#orderCount').text(response.orderCount)
    },
    error: function (error) {
      console.error('Lỗi khi xóa sản phẩm:', error)
    },
  })
}

function updateQuantity(itemId, newQuantity) {
  if (newQuantity < 1) return
  $.ajax({
    url: '/updateCart',
    type: 'post',
    data: { id: itemId, quantity: newQuantity },
    success: function (response) {
      loadCartItems(response.cart_items)
    },
  })
}

function formatCurrency(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ'
}

function checkout() {
  $.ajax({
    url: '/checkout',
    type: 'POST',
    success: function (response) {
      $('#orderCount').text(response.orderCount)
      $('#cartCount').text(response.cartCount)
      loadCartItems(response.cart_items)
      alert(response.message)
      displayOrders(response.orders)
    },
  })
}

function displayOrders(orders) {
  orders.forEach(function (order) {
    console.log(order)
    var html = $(`<div class="order d-flex m-3">
			{{#each this.order_Item}}
				<img src="{{this.product.image_url}}" alt="" style="width: 200px; height: 200px;">
			{{/each}}
			<div class="ml-3">
				<p><strong>Mã đơn hàng:</strong> {{this._id}}</p>
				<p><strong>Tổng giá trị:</strong> {{formatCurrency this.total}}</p>
				<p><strong>Trạng thái:</strong> {{this.status}}</p>
				<p><strong>Ngày tạo:</strong> {{formatDate this.created_at}}</p>

				<ul>
					{{#each this.order_Item}}
					<li>{{this.product.name}} - Số lượng: {{this.quantity}} - Thành tiền:
						<span class="text-danger">{{formatCurrency this.product.price}}</span>
					</li>
					{{/each}}
				</ul>
			</div>
		</div>`)

    // $('#orders-list').append(html);
  })
}

function ratingFormSubmit(e, orderId) {
  e.preventDefault()
  const formData = {
    rating: $(`#rating-${orderId} input[name="rating"]:checked`).val(),
    comment: $('#comment-' + orderId).val(),
    product_id: $('.productId-' + orderId).val(),
  }
  console.log(formData)

  $.ajax({
    url: '/rating',
    type: 'POST',
    data: formData,
    success: function (response) {
      if (response.success) {
        alert('Đánh giá thành công.')
      }
    },
    error: function (error) {
      console.error('Đã xảy ra lỗi khi gửi đánh giá và bình luận: ', error)
    },
  })
}
