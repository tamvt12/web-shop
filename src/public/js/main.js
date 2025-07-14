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
          $('#errorAlert').addClass('text-green-700 bg-green-100')
          $('#errorAlert').removeClass('text-red-700 bg-red-100 hidden')
          $('#errorAlert').text(data.message).show()
        } else {
          $('#errorAlert').addClass('text-red-700 bg-red-100')
          $('#errorAlert').removeClass('text-green-700 bg-green-100	hidden')
          $('#errorAlert').text(data.message).show()
        }
      },
      error: function (xhr, status, error) {
        alert('Đã có lỗi xảy ra. Vui lòng thử lại sau.')
      },
    })
  })

  // Bắt sự kiện submit form checkout
  $('#checkout-form').on('submit', function (e) {
    e.preventDefault()
    checkout()
  })

  // Wishlist (Yêu thích)
  $('#favorite-btn').on('click', function () {
    var productId =
      $('#favorite-btn').data('product-id') ||
      $('#favorite-btn').attr('data-product-id') ||
      $('#favorite-btn').attr('product-id') ||
      $('#favorite-btn').val() ||
      $('#favorite-btn').attr('value') ||
      $('#favorite-btn').attr('data-id') ||
      $('#favorite-btn').attr('data') ||
      $('#favorite-btn').attr('data-product') ||
      $('#favorite-btn').attr('data-productid') ||
      $('#favorite-btn').attr('data-product_id') ||
      $('#favorite-btn').attr('data-product-id')
    if (!productId) {
      productId =
        $('#favorite-btn')
          .attr('onclick')
          ?.match(/'(\d+)'/)?.[1] ||
        $('#favorite-btn')
          .attr('onclick')
          ?.match(/"(\d+)"/)?.[1] ||
        $('#favorite-btn')
          .attr('onclick')
          ?.match(/\((\d+)\)/)?.[1]
    }
    var $icon = $('#favorite-icon')
    var isFavorited = $icon.hasClass('fas')
    if (!productId) return
    if (!isFavorited) {
      $.ajax({
        url: '/favorite/' + productId,
        type: 'POST',
        xhrFields: { withCredentials: true },
        success: function (data) {
          if (data.success) {
            $icon.removeClass('far text-gray-600').addClass('fas text-red-500')
            $('#favorite-count').text(data.favoriteCount + ' lượt thích')
          }
        },
        error: function () {
          alert('Vui lòng đăng nhập để sử dụng tính năng này!')
        },
      })
    } else {
      $.ajax({
        url: '/favorite/' + productId,
        type: 'DELETE',
        xhrFields: { withCredentials: true },
        success: function (data) {
          if (data.success) {
            $icon.removeClass('fas text-red-500').addClass('far text-gray-600')
            $('#favorite-count').text(data.favoriteCount + ' lượt thích')
          }
        },
        error: function () {
          alert('Vui lòng đăng nhập để sử dụng tính năng này!')
        },
      })
    }
  })

  $('#passwordForm').on('submit', function (e) {
    e.preventDefault()

    const currentPassword = $('#currentPassword').val()
    const newPassword = $('#newPassword').val()
    const confirmPassword = $('#confirmPassword').val()

    // Clear previous alerts
    $('#passwordErrorAlert').addClass('hidden')
    $('#passwordSuccessAlert').addClass('hidden')

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      showPasswordError('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (newPassword.length < 6) {
      showPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự')
      return
    }

    if (newPassword !== confirmPassword) {
      showPasswordError('Mật khẩu xác nhận không khớp')
      return
    }

    // Send request to server
    $.ajax({
      url: '/change-password',
      type: 'POST',
      data: {
        currentPassword: currentPassword,
        newPassword: newPassword,
      },
      success: function (response) {
        if (response.success) {
          showPasswordSuccess(response.message)
          $('#passwordForm')[0].reset()
          // Close modal after 2 seconds
          setTimeout(function () {
            togglePasswordModal(false)
          }, 2000)
        } else {
          showPasswordError(response.message)
        }
      },
      error: function (xhr) {
        const response = xhr.responseJSON
        if (response && response.message) {
          showPasswordError(response.message)
        } else {
          showPasswordError('Có lỗi xảy ra, vui lòng thử lại')
        }
      },
    })
  })
})

$('#upload').change(function () {
  const files = this.files
  if (files.length === 0) return

  const formData = new FormData()

  // Thêm tất cả các file được chọn vào FormData
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i])
  }

  $.ajax({
    url: '/admin/upload-image',
    type: 'POST',
    data: formData,
    processData: false,
    contentType: false,
    success: function (results) {
      console.log(results)
      if (results.success) {
        let imageHtml = ''

        // Hiển thị tất cả các ảnh đã upload
        if (Array.isArray(results.imageUrls)) {
          results.imageUrls.forEach(function (imageUrl) {
            imageHtml += `<a href="${imageUrl}" target="_blank" style="display: inline-block; margin: 5px;">
              <img src="${imageUrl}" width="100px" style="border: 1px solid #ddd;">
            </a>`
          })
        } else if (results.imageUrl) {
          // Fallback cho trường hợp chỉ có một ảnh
          imageHtml = `<a href="${results.imageUrl}" target="_blank">
            <img src="${results.imageUrl}" width="100px">
          </a>`
        }

        $('#image_show').html(imageHtml)

        // Cập nhật input hidden với danh sách URL ảnh
        if (Array.isArray(results.imageUrls)) {
          $('#thumb').val(results.imageUrls.join(','))
        } else if (results.imageUrl) {
          $('#thumb').val(results.imageUrl)
        }
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

function ratingFormSubmit(e, orderId) {
  e.preventDefault()
  const form = e.target
  const ratingInput = $(form).find('input[name="rating"]:checked')
  const ratingValue = ratingInput.val()

  if (!ratingValue) {
    alert('Vui lòng chọn số sao đánh giá.')
    return
  }

  const product_ids = $(form)
    .find('input[name="product_ids[]"]')
    .map(function () {
      return $(this).val()
    })
    .get()

  const formData = {
    rating: ratingValue,
    comment: $(form).find('input[name="comment"]').val(),
    product_ids: product_ids,
    order_id: orderId,
  }

  $.ajax({
    url: '/rating',
    type: 'POST',
    data: formData,
    success: function (response) {
      if (response.success) {
        alert('Đánh giá thành công.')
        location.reload()
      }
    },
    error: function (error) {
      console.error('Đã xảy ra lỗi khi gửi đánh giá và bình luận: ', error)
    },
  })
}

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

function updateMainImage(thumbnail) {
  // Remove active class from all thumbnails
  document.querySelectorAll('.thumbnail-image').forEach((img) => {
    img.classList.remove('border-green-600', 'border-2')
    img.classList.add('border-gray-300')
  })

  // Add active class to clicked thumbnail
  thumbnail.classList.remove('border-gray-300')
  thumbnail.classList.add('border-green-600', 'border-2')

  // Update main image
  const mainImage = document.getElementById('mainImage')
  if (mainImage) {
    mainImage.src = thumbnail.src
  }
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

  $.ajax({
    url: '/addCart',
    type: 'POST',
    data: {
      id: productId,
      variantType: selectedVariantType,
      quantity: parseInt(quantity),
    },
    success: function (results) {
      if (results.error === 'Unauthorized') {
        window.location.href = '/login'
      } else {
        if (results.message) {
          alert(results.message)
        }
        if (results.cartCount !== undefined) {
          document.getElementById('cartCount').textContent = results.cartCount
        }
      }
    },
    error: function (xhr, status, error) {
      console.error('Lỗi khi gửi dữ liệu:', error)
    },
  })
}

function buyNow(productId) {
  const quantity = document.getElementById('quantity').value

  $.ajax({
    url: '/addCart',
    type: 'POST',
    data: {
      id: productId,
      variantType: selectedVariantType,
      quantity: parseInt(quantity),
    },
    success: function (results) {
      if (results.error === 'Unauthorized') {
        window.location.href = '/login'
      } else {
        if (results.message) {
          alert(results.message)
        }
        if (results.success) {
          window.location.href = '/cart'
        }
      }
    },
    error: function (xhr, status, error) {
      console.error('Lỗi khi gửi dữ liệu:', error)
    },
  })
}

function renderVariantSelect(item) {
  let select = `<select class="variant-select" data-cart-id="${
    item.id
  }" data-variants='${JSON.stringify(item.variants)}'>`
  item.variants.forEach((variant) => {
    const selected = variant.type === item.variant_type ? 'selected' : ''
    select += `<option value="${variant.type}" ${selected}>${variant.type}</option>`
  })
  select += '</select>'
  return select
}

function loadCartItems(cartItems, total) {
  $('#cart-items').empty()
  if (cartItems.length === 0) {
    $('#cart-total-price').text(formatCurrency(total))
    return
  }
  cartItems.forEach((item) => {
    // Lấy giá theo variant giống cart.hbs
    let price = 0
    if (item.variants && item.variant_type) {
      // Tìm variant phù hợp
      const variant = item.variants.find((v) => v.type === item.variant_type)
      if (variant && variant.price) {
        if (typeof variant.price === 'object' && variant.price.$numberDecimal) {
          price = parseFloat(variant.price.$numberDecimal)
        } else if (typeof variant.price === 'number') {
          price = variant.price
        }
      }
    } else if (item.product && item.product.price) {
      // Fallback nếu không có variants
      if (
        typeof item.product.price === 'object' &&
        item.product.price.$numberDecimal
      ) {
        price = parseFloat(item.product.price.$numberDecimal)
      } else if (typeof item.product.price === 'number') {
        price = item.product.price
      }
    }
    let imageUrl = ''
    if (Array.isArray(item.product.image_url)) {
      imageUrl =
        item.product.image_url.length > 0 ? item.product.image_url[0] : ''
    } else {
      imageUrl = item.product.image_url
    }
    const itemTotal = price * item.quantity

    $('#cart-items').append(`
			<tr class='cart-item border-t'>
				<td class='p-2 border'>
					<img
						src="${imageUrl}"
						alt="${item.product.name}"
						class='w-24 h-auto object-contain'
					/>
				</td>
				<td class='p-2 border'>
					${item.product.name}
					<br>
					${renderVariantSelect(item)}
				</td>
				<td class='p-2 border text-red-600 font-semibold'>
					${formatCurrency(price)}
				</td>
				<td class='p-2 border'>
					<div class='flex items-center justify-center gap-2'>
						<div class='flex items-center justify-between w-32 border rounded'>
							<button
								type='button'
								onclick="updateQuantity('${item.id}', ${item.quantity} - 1)"
								class='px-3 py-1 text-gray-500 hover:bg-gray-100'
							>
								−
							</button>
							<input
								type='number'
								id='quantity-${item.id}'
								value='${item.quantity}'
								min='1'
								class='w-full text-center focus:outline-none'
								onblur="updateQuantity('${item.id}', this.value)"
							/>
							<button
								type='button'
								onclick="updateQuantity('${item.id}', ${item.quantity} + 1)"
								class='px-3 py-1 text-gray-500 hover:bg-gray-100'
							>
								+
							</button>
						</div>
					</div>
				</td>
				<td class='p-2 border text-red-600 font-semibold total-cell'>
					${formatCurrency(itemTotal)}
				</td>
				<td class='p-2'>
					<button
						class='px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600'
						onclick="removeItem('${item.id}')"
					>
						Xóa
					</button>
				</td>
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
      if (response.cartCount) {
        loadCartItems(response.cart_items, response.total)
        $('#cartCount').text(response.cartCount)
        $('#orderCount').text(response.orderCount)
      } else {
        location.reload()
      }
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
      loadCartItems(response.cart_items, response.total)
      $('#cartCount').text(response.cartCount)
    },
  })
}

function formatCurrency(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ'
}

function formatMoney(value) {
  if (!value) return '0 đ'
  let number = value
  if (typeof value === 'object' && number.$numberDecimal) {
    number = number.$numberDecimal
  }
  const priceNumber = parseFloat(number)
  if (isNaN(priceNumber)) return 'Invalid Price'
  return priceNumber.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.') + ' đ'
}

function checkout() {
  // Lấy dữ liệu từ form
  const name = $('#full-name').val()
  const phone = $('#phone').val()
  const address = $('#address').val()
  const shipping = $('input[name="shipping"]:checked').val()
  const payment = $('select[name="payment"]').val()

  $.ajax({
    url: '/checkout',
    type: 'POST',
    data: {
      name,
      phone,
      address,
      shipping,
      payment,
    },
    success: function (response) {
      $('#cartCount').text(response.cartCount)
      alert(response.message)
      window.location.href = '/order'
    },
    error: function (xhr) {
      if (xhr.responseJSON && xhr.responseJSON.error) {
        alert(xhr.responseJSON.error)
      } else {
        alert('Đã xảy ra lỗi khi đặt hàng.')
      }
    },
  })
}
