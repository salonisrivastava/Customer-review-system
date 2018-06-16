var storeType = 'restaurant';
var pData = null;
var productFullData = {};
var productCommentCache = {};
var modalId;
var modalPickerId;
var currentImg = '';
var GGInit = false;
var google_service;
var img_count = 0; //hehe

function loginSuccessCallback() {
  store.is_login = true;
  $('#btn-checkout').trigger('click');
}

function translateShoppingCartItem(index) {
  var pid = shoppingCart[index]['pid'];
  var pData = productFullData[pid];
  shoppingCart[index]['name'] = pData['nm'];
  shoppingCart[index]['sf'] = pData['sf'];

  if (shoppingCart[index]['pt'] == 0 && shoppingCart[index]['opt'] != undefined && shoppingCart[index]['opt'].length != 0) {
    var optionDetail = [];
    var opt = shoppingCart[index]['opt'];
    for (var optParent in opt) {
      var tempElementArray = [];
      for (var optElement in opt[optParent]) {
        tempElementArray.push(pData['opt'][optParent]['opts'][optElement]['nm']);
      }
      optionDetail.push({
        'nm': pData['opt'][optParent]['nm'],
        'opt': tempElementArray
      });
    }

    shoppingCart[index]['optionDetail'] = optionDetail;
  }

}

function initCart() {
  var localData = $.isEmptyObject(getFromLocal('g' + groupId)) ? {} : getFromLocal('g' + groupId);
  shoppingCart = $.isEmptyObject(localData['shoppingCart']) ? [] : localData['shoppingCart'];
  store.coupon = $.isEmptyObject(localData['coupon']) ? '' : localData['coupon'];
  store.coupon_pid = $.isEmptyObject(localData['coupon_pid']) ? '' : localData['coupon_pid'];

  if (!$.isEmptyObject(shoppingCart)) {
    var newIds = [];
    for (var i = 0; i < shoppingCart.length; i++) {
      if (!productFullData[shoppingCart[i]['pid']]) {
        newIds.push(shoppingCart[i]['pid']);
      }
    }
    if (store.pagination == '1' && newIds.length) {
      var url = DOMAIN + `/api/v7/cplst?gid=${groupId}&lan=${dataLan}&ids=${newIds.join()}&country=${$data.currentCountry}`;
      $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
      }).done(function(res) {
        if (res['RC'] == 200) {
          for (var i = 0; i < res['records'].length; i++) {
            productFullData[res['records'][i]['pid']] = res['records'][i];
          }
        }
        for (i = 0; i < shoppingCart.length; i++) {
          if (!productFullData[shoppingCart[i]['pid']]) {
            console.log('Product Not Exist:' + shoppingCart[i]);
            shoppingCart.splice(i, 1);
            i--;
            continue;
          }

          try {
            translateShoppingCartItem(i);
          } catch (err) {
            console.log('Old Product Data' + shoppingCart[i]);
            shoppingCart.splice(i, 1);
            i--;
            continue;
          }
          refreshProductCell(shoppingCart[i]['pid']);
        }

        refreshCartList();

      });
    } else {
      for (i = 0; i < shoppingCart.length; i++) {
        if (!productFullData[shoppingCart[i]['pid']]) {
          console.log('Product Not Exist:' + shoppingCart[i]);
          shoppingCart.splice(i, 1);
          i--;
          continue;
        }

        try {
          translateShoppingCartItem(i);
        } catch (err) {
          console.log('Old Product Data' + shoppingCart[i]);
          shoppingCart.splice(i, 1);
          i--;
          continue;
        }
        refreshProductCell(shoppingCart[i]['pid']);
      }
      refreshCartList();
    }
  }

  if (store.coupon_pid != '') {
    refreshProductCell(store.coupon_pid);
  }
}

function initProduct(productData) {
  // if (data['RC'] == 200 && data['records']['product']['pid'] != undefined) {
  //
  // } else {
  //   $('#main-loader').remove();
  //   alert(trans['fail_load_product'], function() {
  //     window.location.replace('/store/?gid=' + groupId);
  //   });
  //   return;
  // }

  pData = $data['productDetail'];
  /* check spacial price status
   * if the product special price is valid, add to pc field, and original pc field to old_price
   */
  var currentTime = new Date().getTime();
  if (pData['spc']) {
    var startTime = Date.parse(pData['sdt']);
    var endTime = Date.parse(pData['edt']);
    if (currentTime >= startTime && currentTime <= endTime) {
      pData['old_price'] = pData['pc'];
      pData['pc'] = pData['spc'];
    }
  }

  productFullData[pData['pid']] = pData;

  if (pData['pt'] == 4) {
    $('#modal-plus').attr('disabled', 'disabled');
  } else {
    $('#modal-plus').removeAttr('disabled');
  }

  if (pData['pt'] == 1 || pData['pt'] == 4) {
    /*
    $('.reviewWrap').hide();
    var domFreeShippingOptions = '<option value="freeShipping" selected="selected" text="'+t['free_shipping']+'">'+t['free_shipping']+'</option>';
    $('#shippingMethod').html(domFreeShippingOptions);
    $('#shippingMethodText').html(t['free_shipping']);
    $('#shippingMethodWrap').css('cssText', 'background-color: #fff !important;');
    $('#shippingMethod').css('cssText','z-index: -1;');
*/
  }
  initRecentViewedHistory();
  initRelatedProduct();

  modalId = pData['pid'];
  fillBasicInfo();
  initCart();
  createCategories();
  // fill product with option basic info
  if (!$.isEmptyObject(pData['opt'])) {
    initOptionPicker(modalId);
    $('#option-area-wrap').show();
    if ($('#option-list').height() == 150) {
      // 150px is the $('#option-list') max height when it is not expanded
      $('#option-list-read-more').show();
    } else {
      $('#option-list-read-more').hide();
    }
  }
}

function initRecentViewedHistory() {
  if ($.isEmptyObject(store_history)) {
    return;
  }

  var recentViewedHistoryHtml = '';
  for (var i = 0; i < store_history.length; i++) {
    var item = store_history[i];
    if (typeof item['p_info'] == 'undefined') {
      //for store
      recentViewedHistoryHtml += cardSlot(item['s_img'], item['s_nm'], '', '', item['s_phone'], '/store/?gid=' + item['s_id']);
    } else {
      //for product
      recentViewedHistoryHtml +=
        cardSlot(
          item['p_info']['p_img'], item['p_info']['p_nm'],
          '',
          ((typeof item['p_info']['p_old_price'] != 'undefined') ? currencySymbol + item['p_info']['p_old_price'] : ''),
          ((typeof item['p_info']['p_pc'] != 'undefined') ? currencySymbol + item['p_info']['p_pc'] : ''),
          '/product/' + item['p_info']['p_id']
        );
    }
  }

  $('#recent-viewed-history').html(recentViewedHistoryHtml);
}

function initRelatedProduct() {
  if (!pData['related_products'] || pData['related_products'].length === 0) {
    $('[tab-data="related-products"]').hide();
    $('[tab-data="recent-viewed-history"]').trigger('click');
    $('#related-products-wrap').hide();
    return;
  }

  $('#related-products-wrap').show();
  var url = DOMAIN + '/api/v6/pshort?gid=' + groupId + '&ids=' + pData['related_products'].join(',') + '&lan=' + dataLan;

  $.ajax({
    type: "GET",
    url: url,
    dataType: "json",
  }).done(function(res) {
    console.log('related_products', res);
    var relatedProductsHtml = '';
    var imgPrefix = CLOUDINARY + 'w_342,h_192,c_limit,f_auto,q_auto/';
    for (var i = 0; i < res['records'].length; i++) {
      var item = res['records'][i];
      var productDisplayPid = (item['url_key'] == '') ? item['id'] : item['url_key'];
      var productUrl = '/product/' + productDisplayPid;
      relatedProductsHtml += cardSlot(imgPrefix + item['image'], item['name'], '', currencySymbol + item['price'], (!$.isEmptyObject(item['spc']) ? currencySymbol + item['spc'] : ''), productUrl);
    }
    $('#related-products').html(relatedProductsHtml);

    $('#related-products, #recent-viewed-history').slick({
      dots: true,
      arrows: true,
      infinite: false,
      slidesToShow: 6,
      slidesToScroll: 6,
      variableWidth: true,
    });
  });
}

//for related_products cardSlot
function cardSlot(img, name, desc, left, right, url) {
  var result = `
  <div class="ui card cu-link" href="${url}">
    <div class="image cu-ratio">
      <img src="${img}" class="cu-ratio-content" alt="${$.tools.escapeHtml(name)}">
    </div>
    <div class="content">
      <a class="header">${name}</a>
      <div class="description">${desc}</div>
    </div>
    <div class="extra content">
      ${((left == '') ? '' : '<span class="left">' + left + '</span>')}
      <span class="right">` + right + `</span>
    </div>
  </div>`;
  return result;
}

function createCategories() {
  var catContent;
  var productCatNameArray = [];
  var productCatContent = '';
  for (var i = 0; i < $data['catList'].length; i++) {
    if ($data['productDetail']['ctids'].indexOf($data['catList'][i]['id']) !== -1) {
      i==0 ? productCatNameArray.push($data['catList'][i]['name']) : productCatNameArray.push(' ' + $data['catList'][i]['name']);
    }
  }

  if (productCatNameArray.length !== 0) {
    productCatContent = productCatNameArray.join();
    if (productCatContent.length > 15) {
      productCatContent = productCatContent.slice(0, 30) + ' ...';
    }
  }

  if (individual) {
    if (productCatContent !== '') {
      productCatContent = `
      <a href="/?cids=${$data['productDetail']['ctids'].join()}">
        ${productCatContent}
      </a>
      <i class="angle right icon"></i>`;
    }

    catContent = `
        ${productCatContent}
      <a href="javascript:void(0);">
        ${pData.nm}
      </a>
    `;
  } else {
    if (productCatContent !== '') {
      productCatContent = `
      <a href="/store/${groupId}?cids=${$data['productDetail']['ctids'].join()}">
        ${productCatContent}
      </a>
      <i class="angle right icon"></i>`;
    }
    catContent = `
      <a href="/${store.type}/">
      ${trans[store.type]}
      </a>
      <i class="angle right icon"></i>
      <a href="/store/${groupId}">
        ${store.nm}
      </a>
      <i class="angle right icon"></i>
        ${productCatContent}
      <a href="">
        ${pData.nm}
      </a>
    `;
  }
  $('.category-list').html(catContent);
}

function share(thisObj) {
  $('#hide-google-iframe').remove();

  var params = {};
  var type = thisObj.attr('share');

  params.img = productFullData[modalId]['iurl'];
  params.title = productFullData[modalId]['nm'];
  params.desc = productFullData[modalId]['product_detail']['dsc'];
  params.storeTitle = store.nm;

  var urlParams = $.tools.getUrlParameters();
  params.url = location.origin + location.pathname;

  updateShareObj(type, params);
  if (type == 'fb') {
    shareFB(FBObj);
  } else if (type == 'tw') {
    shareTw('https://twitter.com/intent/tweet?via=goopter&url=' + encodeURIComponent(params.url) + '&text=' + params.title);
  } else if (type == 'wc') {
    shareWc(params.url);
  } else if (type == 'email') {
    shareEmail(params.url, params.title, params.storeTitle, params.img);
  }
}

function updateShareObj(type, params) {
  if (type == 'fb') {
    var img;
    if (params.img) {
      img = CLOUDINARY + params.img;
    } else {
      img = CLOUDINARY + 'admin/i_' + storeType + '_small_grey.png';
    }
    if (params.title) {
      FBObj['og:title'] = params.title;
    }
    if (params.desc != undefined) {
      FBObj['og:description'] = params.desc.replace(/(<([^>]+)>)/ig, "");
    }
    if (params.url != undefined) {
      FBObj['og:url'] = params.url;
    }
    FBObj['og:image'] = img;
  }
  // else if (type == 'tw') {
  //
  // } else if (type == 'wc') {
  //
  // }
}

function refreshCartList() {
  var i;
  var item;
  var listHtml = '';
  var total = 0;
  var count = 0;
  var points = 0;
  var extraForDelivery = '';

  giftcardOnly = true;
  for (i = 0; i < shoppingCart.length; i++) {
    item = shoppingCart[i];
    //determain if it is a giftcard
    if (item['pt'] != 1) {
      giftcardOnly = false;
    }

    //if it is self input
    if (item['pt'] == 2) {
      listHtml += `
      <li>
        <div class="cu-table">
          <div class="cu-table-cell cart-item-name-wrap">
            <p class="cart-item-name">${item['name']}</p>
          </div>
          <div class="cu-table-cell cart-item-button-wrap">
            <button class="btn-cart-minus compact ui button" index="${i}">-</button><span class="item-count">1</span><button index="${i}" class="btn-cart-plus compact ui button disabled">+</button>
          </div>
          <div class="cu-table-cell cu-text-align-right cart-item-price product-price">$${$.tools.currencyFormatter(item['price'] * item['count'], 2)}</div>
        </div>
        ${(store.type === 'restaurant' || typeof item['sf'] === 'undefined' || $('#select-shipping').val() !== 'delivery')?'':`
          <div class="option-details shipping-fee-display">
            <p><b>Shipping</b>: Price: $${item['sf']['pc']}, Duration: ${item['sf']['min']}-${item['sf']['max']} Days</p>
          </div>
        `}
      </li>`;
      total += (item['price'] * item['count']);
      count += 1;
    } else if (item['opt'] == undefined) {
      listHtml += `
      <li>
        <div class="cu-table">
          <div class="cu-table-cell cart-item-name-wrap">
            <p class="cart-item-name">${item['name']}</p>
          </div>
          <div class="cu-table-cell cart-item-button-wrap">
            <button class="btn-cart-minus compact ui button" index="${i}">-</button><input class="item-count" value="${item['count']}" data-index="${i}"><button index="${i}" class="btn-cart-plus compact ui button">+</button>
          </div>
          <div class="cu-table-cell cu-text-align-right cart-item-price product-price">$${$.tools.currencyFormatter(item['price'] * item['count'], 2)}</div>
        </div>
        ${(store.type === 'restaurant' || typeof item['sf'] === 'undefined' || $('#select-shipping').val() !== 'delivery')?'':`
          <div class="option-details shipping-fee-display">
            <p><b>Shipping</b>: Price: $${item['sf']['pc']}, Duration: ${item['sf']['min']}-${item['sf']['max']} Days</p>
          </div>
        `}
      </li>`;
      total += (item['price'] * item['count']);
      count += item['count'];
    } else {
      var optionDetailDisplay =
        item['optionDetail'].map(function(value) {
          return '<p>' + value['nm'] + ': ' + value['opt'].join(', ') + '</p>';
        });

      var optionDetails = '<div class="option-details" ' + ((item['optionDetail'].length === 0) ? 'hidden' : '') + '>' + optionDetailDisplay.join('') + '</div>';

      listHtml += `
      <li>
        <div class="cu-table">
          <div class="cu-table-cell cart-item-name-wrap">
            <p class="cart-item-name">${item['name']}</p>
          </div>
          <div class="cu-table-cell cart-item-button-wrap">
            <button class="btn-cart-minus compact ui button" index="${i}">-</button><input class="item-count" value="${item['count']}" data-index="${i}"><button index="${i}" class="btn-cart-plus compact ui button">+</button>
          </div>
          <div class="cu-table-cell cu-text-align-right cart-item-price product-price">$${$.tools.currencyFormatter(item['price'] * item['count'], 2)}</div>
        </div>
        ${optionDetails}
        ${(store.type === 'restaurant' || typeof item['sf'] === 'undefined' || $('#select-shipping').val() !== 'delivery')?'':`
          <div class="option-details shipping-fee-display">
            <p><b>Shipping</b>: Price: $${item['sf']['pc']}, Duration: ${item['sf']['min']}-${item['sf']['max']} Days</p>
          </div>
        `}
      </li>`;

      total += (item['price'] * item['count']);
      count += item['count'];
    }
  }

  extraForDelivery = store.min_delivery_amount - total
  points = total * store.v2p;
  $('.shop-points').find('span').html(round(points));
  //refresh cart list
  $('#cart-list').html(listHtml);
  
  // if (count == 0) {
  //   $('#btn-cart').html(trans['cart_is_empty']);
  //   $('.shop-cart-count').hide();
  //   $('#shipping-method-display').show();
  //   $('#btn-checkout').addClass('disabled');
  // } else {
  //   $('#btn-cart').html('$<span class="shop-cartprice-display">' + $.tools.currencyFormatter(total, 2) + '</span>');
  //   $('.shop-cart-count').html(count).show();
  //   $('#btn-checkout').removeClass('disabled');
  // }

  if (count == 0) {
    $('#btn-cart').html(trans['cart_is_empty']);
    $('.shop-cart-count').hide();
    $('#shipping-method-display').show();
    $('#btn-checkout').addClass("disabled");
  } else {
    if ($('#select-shipping').val() == 'delivery' && total < store.min_delivery_amount && store.delivery_fee >= 0) {
      console.log('nihao')
      // if statement for translation difference only.
      if (total == 0 || '') {
        $('#btn-checkout').html(sprintf(trans['min_delivery_price'], extraForDelivery.toFixed(2)))
      } else {
        $('#btn-checkout').html(sprintf(trans['extra_delivery_price_needed'], extraForDelivery.toFixed(2)))
      }
      $('#btn-checkout').addClass('extra-delivery-needed')
      $('#btn-checkout').addClass('disabled');
    } else {
      $('#btn-checkout').html(`${trans['checkout']}`)
      $('#btn-checkout').removeClass('extra-delivery-needed')
      $('#btn-checkout').removeClass('disabled');
      $('#btn-cart').html('$<span class="shop-cartprice-display">' + $.tools.currencyFormatter(total, 2) + '</span>');
      $('.shop-cart-count').html(count).show();
    }
  }

  //refresh #shipping-method-display
  if (giftcardOnly) {
    $('#shipping-method-display').hide();
  } else {
    $('#shipping-method-display').show();
  }

  //refresh popup
  $('#cart-list > li')
    .popup();

  //save shopping cart and coupon to local storage
  var localData = {
    'shoppingCart': shoppingCart,
    'coupon': store.coupon,
    'coupon_pid': store.coupon_pid
  };
  saveToLocal('g' + groupId, localData);
}

function loadProductReview(pid, page, commentSelector) {
  console.log('loadingproductreviewnow');
  var url = DOMAIN + '/api/v7/p_review?pid=' + pid + '&page=' + page + '&limit=10';
  console.log('url',url);
  commentDom = $(commentSelector);
  commentDom.html('<div class="ui active centered inline loader"></div>');
  //check if current product have cached comment;
  if (productCommentCache.pid == pid && productCommentCache.total != undefined && productCommentCache.pages[page] != undefined) {
    refreshProductComment(pid, page, commentSelector, productCommentCache);
  } else {
    //call ajax and save the cache
    $.ajax({
      type: "GET",
      url: url,
      dataType: "json",
      beforeSend: function() {

      }
    }).done(function(res) {
      if (res['RC'] == 200) {
        console.log(res,"load product review finished");
        if (productCommentCache.pid == undefined || productCommentCache.pid != pid) {
          productCommentCache.pid = pid;
          productCommentCache.pages = {};
        }
        productCommentCache.pages[page] = res['records'];
        productCommentCache.total = res['paging']['total'];
        refreshProductComment(pid, page, commentSelector, productCommentCache);
      } else {
        commentDom.find('.loader').remove();
        return;
      }
    });
  }
}

function refreshProductComment(pid, page, commentSelector, productCommentCache) {
  //refresh the product comment list
  commentDom = $(commentSelector);
  commentDom.find('.loader').remove();
  if (productCommentCache.pages[page].length == 0) {
    commentDom.html('');
    commentDom.next().html('');
    $('#product-comment-option .no-review-toggle').show();
    $('#product-comment-option .has-review-toggle').hide();
    return;
  } else {
    $('#first-review').html('');
    $('#product-comment-option .no-review-toggle').hide();
    $('#product-comment-option .has-review-toggle').show();
  }
  var html = createReviewList(productCommentCache.pages[page], false);
  commentDom.next().html(createPagination(pid, page, productCommentCache.total, 3, commentSelector));
  commentDom.html(html);
  $('.rating').rating('disable');
}

function createReviewList(reviewData, isStore) {
  console.log('createReviewList');
  var result = '';
  var i, review;
  for (i = 0; i < reviewData.length; i++) {
    review = reviewData[i];
    console.log('review',i,review);
    var image = '';
    var divider = '<div class="ui divider"></div>';
    if (isStore) {
      image = `
      <a class="avatar">
        <img src="${CLOUDINARY}image/upload/v1487613621/admin/avatar.png">\
      </a>`;
      divider = '';
    }
    result += '\
    <div class="comment">\
      ' + image + '\
      <div class="content">\
        <a class="author">' + review['author'] + '</a>\
        <div class="metadata"><span class="date">' + timeToLocal(review['review_dt']) + '</span></div>\
        <div class="actions">\
          <a class="reply"><div class="ui small star rating" data-rating="' + Math.round(review['rat']) + '" data-max-rating="5"></div></a>\
        </div>\
        <div class="text">' + review['cmt'] + '</div>\
      </div>\
    </div>' + divider;
  }
  return result;
}

function createPagination(currentPid, currentPage, totalItem, itemsPerPage, commentSelector) {
  var result = '';
  if (totalItem > itemsPerPage) {
    var prevBtn = '';
    var nextBtn = '';
    var totalPage = Math.ceil(totalItem / itemsPerPage);
    var currentCount = 0;
    currentPage = Math.round(currentPage);
    if (totalPage >= 8) {
      prevBtn = '<a class="item product-pagination ' + ((currentPage > 1) ? '' : 'disabled') + '" data-page=' + ((currentPage <= 1) ? currentPage : currentPage - 1) + ' pid=' + currentPid + ' data-comment-selector="' + commentSelector + '"><</a>';
      nextBtn = '<a class="item product-pagination ' + ((currentPage < totalPage) ? '' : 'disabled') + '" data-page=' + ((currentPage >= totalPage) ? currentPage : currentPage + 1) + ' pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">></a>';

      //before current page
      result = '<div class="ui pagination menu">' + prevBtn;

      if (currentPage < 4) {
        for (i = 1; i <= 4; i++) {
          result += '<a class="item product-pagination ' + ((i == currentPage) ? 'active' : '') + '" data-page=' + i + ' pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">' + i + '</a>';
        }
        currentCount = 4;
      } else {
        result += '<a class="item product-pagination" data-page=1 pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">1</a>';
        result += '<a class="item product-pagination disabled" pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">...</a>';
        if (totalPage - currentPage < 4) {
          for (i = (totalPage - 4); i <= currentPage; i++) {
            result += '<a class="item product-pagination ' + ((i == currentPage) ? 'active' : '') + '" data-page=' + i + ' pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">' + i + '</a>';
          }
        } else {
          result += '<a class="item product-pagination" data-page=' + (currentPage - 1) + ' pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">' + (currentPage - 1) + '</a>';
          result += '<a class="item product-pagination active" data-page=' + (currentPage) + ' pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">' + (currentPage) + '</a>';
        }

        currentCount = currentPage;
      }

      if (totalPage - currentCount <= 3) {
        for (var i = currentCount + 1; i <= totalPage; i++) {
          result += '<a class="item product-pagination" data-page=' + i + ' pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">' + i + '</a>';
        }
      } else {
        result += '<a class="item product-pagination" data-page=' + (currentCount + 1) + ' pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">' + (currentCount + 1) + '</a>';
        result += '<a class="item product-pagination disabled" pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">...</a>';
        result += '<a class="item product-pagination" data-page=' + totalPage + ' pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">' + totalPage + '</a>';
      }
      result += nextBtn + '</div>';
    } else {
      for (i = 1; i <= totalPage; i++) {
        result += '<a class="item product-pagination ' + ((i == currentPage) ? 'active' : '') + '" data-page=' + i + ' pid=' + currentPid + ' data-comment-selector="' + commentSelector + '">' + i + '</a>';
      }
    }

  }

  return result;
}

function fillBasicInfo() {
  //fill meta info
  $('title').prepend($.tools.escapeHtml(pData['nm']) + ':');
  $('meta[name="title"], meta[name="description"], meta[name="keywords"]').each(function() {
    $(this).attr('content', pData['nm'] + ':' + $(this).attr('content'));
  })

  $('#product-name').html(pData['nm']);
  $('#product-store-name h3').show();
  $('#product-store-name .loader').remove();
  var imgs, i;
  imgs = pData['product_detail']['imgs'];

  $('#gallery').html(createImgGallery(imgs));
  // $('#gallery .image-zoom-container').imageZoom();

  $('#product-rating').html('<div class="ui star rating" data-max-rating="5" data-rating="' + Math.round(pData['rat']) + '"></div>');
  $('.rating').rating('disable');

  $('.product-short-desc').html(((pData['product_detail']['dsc']) ? pData['product_detail']['dsc'] : trans['no_description']));
  $('.product-desc').html(((pData['product_detail']['dsc']) ? pData['product_detail']['dsc'] : trans['no_description']));
  $('.accordion').accordion();
  $('#product-comment-wrap').accordion({
    selector: {
      accordion: '.accordion',
      title: '.title',
      trigger: '.title',
      content: '.content'
    }
  });

  if (pData['pt'] == 2) {
    $('#normal-product-option-wrap').hide();
    $('#selfinput-option-wrap').show();
    $('#modal-selfinput-button-wrap button').html(createProductCell(pData));
  } else {
    if (pData['pt'] == 3) {
      //call vendor
      $('#product-price').html(store.phone);
    } else if (pData['pt'] == 4) {
      //coupon
      if (pData['f3'] == 0 || pData['f3'] == undefined) {
        //discount amount
        $('#product-price').html(currencySymbol + pData['pc']);
      } else if (pData['f3'] == 1) {
        //percentage
        $('#product-price').html(pData['pc'] + '%');
      }
    } else {
      $('#product-price').html(((pData['old_price']) ? '<del>' + currencySymbol + pData['old_price'] + '</del>' : '') + currencySymbol + pData['pc']);
    }
    $('#selfinput-option-wrap').hide();
    $('#normal-product-option-wrap').show();
    $('#product-option').html(createProductCell(pData));
  }

  $('#main-loader').remove();
  addProductHistory(productId);

  //for google sharing
  GGObjProduct.contenturl = 'https://shop.goopter.com/store/preview.php?param=' + pData['iurl'];
  GGObjProduct.calltoactionurl = 'https://shop.goopter.com/product/' + productId ;
  GGObjProduct.prefilltext = pData['nm'] + ' (' + GGObjProduct.calltoactionurl + ')';
  shareGg('share-gg', GGObjProduct);
}

function initOptionPicker(pid) {
  if (pid == modalPickerId) {
    refreshPickerSection();
    return;
  }
  picker = {};
  var pData = productFullData[pid];
  var productPriceText = '<span class="price-unit">' + currencySymbol + '</span>' + pData['pc'];
  var newOpt = {};
  var i, j, optData, pc, name;
  if ($.isArray(pData['opt'])) {
    newOpt = {};
    for (i = 0; i < pData['opt'].length; i++) {
      optData = pData['opt'][i];
      if (optData['min'] == undefined) {
        optData['min'] = 0;
      }
      if (optData['max'] == undefined) {
        optData['max'] = 1;
      }
      newOpt[optData['id']] = $.extend(true, {}, optData);
      newOpt[optData['id']]['opts'] = {};

      for (j = 0; j < optData['opts'].length; j++) {
        newOpt[optData['id']]['opts'][optData['opts'][j]['id']] = optData['opts'][j];
      }
    }
    productFullData[pid]['opt'] = newOpt;
  } else {
    newOpt = pData['opt'];
  }

  pickerPrice = pData['pc'];
  var optionHtml = '';
  for (i in newOpt) {
    optData = newOpt[i];

    //optionTitle
    optionTitle = '';
    if (optData['max'] == 1) {
      if (optData['min'] == 0) {
        optionTitle = '(' + trans['optional'] + ')';
      } else if (optData['min'] == 1) {
        optionTitle = '(' + trans['option_single_selection'] + ')';
      }
    } else if (optData['max'] > 1 && optData['max'] != optData['min']) {
      optionTitle = '(' + trans['option_pick'] + ' ' + optData['min'] + '-' + optData['max'] + ' ' + trans['option_item'] + ')';
    } else if (optData['max'] > 1 && optData['max'] == optData['min']) {
      optionTitle = '(' + trans['option_pick'] + ' ' + optData['max'] + ' ' + trans['option_item'] + ')';
    }
    //optionTitle end

    optionHtml += '<div class="option-list-item" optid="' + i + '"><div class="option-title"><b>' + optData['nm'] + ':</b> ' + optionTitle + '</div><div class="option-content">';
    for (j in optData['opts']) {
      pc = optData['opts'][j]['pc'];
      if (pc == 0) {
        name = optData['opts'][j]['nm'];
      } else if (pc > 0) {
        name = optData['opts'][j]['nm'] + '(+$' + pc + ')';
      } else {
        name = optData['opts'][j]['nm'] + '($' + pc + ')';
      }
      optionHtml += '<button class="ui toggle button btn-option-selector cu-amazon-option-button" optid="' + j + '" pc="' + pc + '" img-index="' + optData['opts'][j]['img'] + '">' + name + '</button>';
    }
    optionHtml += '</div></div>';
  }
  $('#option-list').html(optionHtml);
  modalPickerId = pid;
  refreshPickerSection();
}

/**
 * [reloadOptionPicker description]
 * @param  {[type]} pid [
 * set the picker, pickerPrice, pickerCount and add active class
 * logic: if the shoppingCart has current product, reload first one, else reload minimum requirement
 * ]
 * @return {[type]}     [description]
 */
function reloadOptionPicker(pid) {
  $('#option-list .btn-option-selector').removeClass('active');
  picker = {};
  pickerPrice = 0;
  var firstInShoppingCart = {};
  for (var i = 0; i < shoppingCart.length; i++) {
    if (shoppingCart[i]['pid'] == pid) {
      firstInShoppingCart = shoppingCart[i];
      break;
    }
  }
  if ($.isEmptyObject(firstInShoppingCart)) {
    var pData = productFullData[pid];
    pickerPrice = pData['pc']
    for (i in pData['opt']) {
      var optData = pData['opt'][i];
      var optCount = 0;
      for (var j in optData['opts']) {
        if (optCount >= optData['min']) {
          break;
        }
        $('#option-list .option-list-item[optid="' + i + '"] .btn-option-selector[optid="' + j + '"]').addClass('active');
        if (!picker[i]) {
          picker[i] = {};
        }
        picker[i][j] = {
          'nm': optData['opts'][j]['nm']
        };
        pickerPrice += optData['opts'][j]['pc'];
        optCount++;
      }
    }
  } else {
    pickerPrice = firstInShoppingCart['price'];
    for (i in firstInShoppingCart['opt']) {
      optData = firstInShoppingCart['opt'][i];
      for (j in optData) {
        $('#option-list .option-list-item[optid="' + i + '"] .btn-option-selector[optid="' + j + '"]').addClass('active');
        if (!picker[i]) {
          picker[i] = {};
        }
        picker[i][j] = {
          'nm': optData[j]
        };
      }
    }
  }

  refreshPickerSection();
  $('#option-price-picked').html('<span class="price-unit">' + currencySymbol + '</span><span class="price">' + round(pickerPrice, 2) + '</span>');
}

function checkOptionItemCount() {
  var result = 0;
  if (shoppingCart.length) {
    var i;
    var optData;
    for (i = 0; i < shoppingCart.length; i++) {
      if (shoppingCart[i]['pid'] != modalPickerId) {
        continue;
      }
      optData = shoppingCart[i]['opt'];
      if (compareOpt(optData, picker)) {
        result = shoppingCart[i]['count'];
        pickerIndex = i;
        break;
      }
    }
  }
  return result;
}

function compareOpt(opt1, opt2) {
  var result = true;
  if (Object.keys(opt1).length != Object.keys(opt2).length) {
    result = false;
  } else {
    var key, value1, value2, optKey;
    for (key in opt1) {
      if (opt2[key] == undefined) {
        result = false;
        break;
      }
      value1 = opt1[key];
      value2 = opt2[key];
      if (Object.keys(value1).length != Object.keys(value2).length) {
        result = false;
        break;
      }
      for (optKey in value1) {
        if (value2[optKey] == undefined) {
          result = false;
          break;
        }
      }
    }
  }
  return result;
}

function validateFilter() {
  if (store.menu && $.isEmptyObject($('#select-menu').val())) {
    alert(trans['alert_choose_menu']);
    return false;
  }
  if ($('.child.checkbox:visible').find('input:checked').length == 0) {
    alert(trans['alert_choose_categories']);
    return false;
  }
  return true;
}

function validateOption() {
  var result = {};
  var optData = productFullData[modalPickerId]['opt'];
  var opt;
  var currentSelectCount = 0;
  for (opt in optData) {
    if (picker[opt]) {
      currentSelectCount = Object.keys(picker[opt]).length;
    } else {
      currentSelectCount = 0;
    }

    if (optData[opt]['min'] == optData[opt]['max'] && optData[opt]['max'] == 1 && currentSelectCount != 1) {
      result.alert_name = optData[opt]['nm'];
      result.alert_type = 'min-max-1';
      result.alert_text = 'alert_option_mandatory_one';
      result.alert_amount = optData[opt]['min'];
      break;
    }

    if (currentSelectCount < optData[opt]['min']) {
      result.alert_name = optData[opt]['nm'];
      result.alert_type = 'min';
      result.alert_text = 'alert_option_minimum_pick';
      result.alert_amount = optData[opt]['min'];
      break;
    }
    if (currentSelectCount > optData[opt]['max']) {
      result.alert_name = optData[opt]['nm'];
      result.alert_type = 'max';
      result.alert_text = 'alert_option_maximum_pick';
      result.alert_amount = optData[opt]['max'];
      break;
    }
  }

  return result;
}

function validateStock(pid) {
  if (pid != productId) {
    return true;
  }

  var count = 0;
  for (var i = 0; i < shoppingCart.length; i++) {
    if (shoppingCart[i]['pid'] == pid) {
      if (shoppingCart[i]['pt'] == 0 || shoppingCart[i]['pt'] == 1) {
        //normal product and gift card
        count += shoppingCart[i]['count'];
        if (shoppingCart[i]['opt'] == undefined) {
          break;
        }
      } else if (shoppingCart[i]['pt'] == 2) {
        //self input
        count = 1;
        break;
      }
    }
  }

  if (count >= productFullData[pid]['sq']) {
    alert(trans['alert_exceed_stock']);
    return false;
  } else {
    return true;
  }
}

function checkout() {
  if (!validateCheckout()) {
    return;
  }
  $('#input-cart').attr('value', JSON.stringify(shoppingCart));
  if (giftcardOnly) {
    $('#input-shipping').attr('value', 'freeShipping');
  } else {
    $('#input-shipping').attr('value', $('#select-shipping').val());
  }
  $('#input-coupon').attr('value', store.coupon);
  //console.log($('form').serializeObject());
  $('#form-checkout').submit();
}

function validateCheckout() {
  //return if the check button is disabled
  if ($('#btn-checkout').is('.disabled')) {
    return false;
  }

  var errorMessage = [];
  //check shipping address
  if (!giftcardOnly && $('#select-shipping').val() == "") {
    errorMessage.push(trans['alert_shipping_address']);
  }

  if (errorMessage.length != 0) {
    alert(errorMessage[0]);
    return false;
  }

  //check if it is login
  if (!store.is_login) {
    login();
    return false;
  }
  return true;
}

function createProductCell(pData) {
  if (pData['pt'] == 1) {
    return cellGift(pData);
  } else if (pData['pt'] == 2) {
    return cellSelf(pData);
  } else if (pData['pt'] == 3) {
    return cellVendor(pData);
  } else if (pData['pt'] == 4) {
    return cellCoupon(pData);
  } else if (pData['opt'] && pData['opt'].length) {
    return cellWithOption(pData);
  } else {
    return cellNoOption(pData);
  }
}

function cellWithOption(pData) {
  var result = '<button style="display: none;" class="ui compact button btn-remove-with-option" pid="' + pData['pid'] + '"></button><span class="item-count" pid="' + pData['pid'] + '"></span><button pid="' + pData['pid'] + '"  class="ui button compact btn-add-with-option" onclick="addWithOption();" style="display:none;"></button><button class="ui button button-holder" pid="' + pData['pid'] + '">' + trans['add_to_cart'] + '</button>';
  return result;
}

function cellNoOption(pData) {
  var result = '<button style="display: none;" class="ui compact button btn-remove-no-option" pid="' + pData['pid'] + '"></button><span class="item-count" pid="' + pData['pid'] + '"></span><button class="ui compact button btn-add-no-option" pid="' + pData['pid'] + '" style="display:none;"></button><button class="ui button button-holder" pid="' + pData['pid'] + '">' + trans['add_to_cart'] + '</button>';
  return result;
}

function cellVendor(pData) {
  var result = '<button class="ui right labeled icon button call-vendor-button button-holder" pid="' + pData['pid'] + '"><i class="call icon"></i>' + trans['call_vendor'] + '</button>';
  return result;
}

function cellGift(pData) {
  return cellNoOption(pData);
}

function cellSelf(pData) {
  var result = '<button class="ui right labeled icon button self-input-button button-holder" pid="' + pData['pid'] + '"><i class="edit icon"></i>' + trans['self_input'] + '</button>';
  return result;
}

function cellCoupon(pData) {
  var result = '<button class="ui right labeled icon button apply-coupon-button button-holder" pid=' + pData['pid'] + '><i class="tag icon"></i>' + trans['apply_coupon'] + '</button>';
  return result;
}

function createImgGallery(imgs) {
  var imgUrl = '';
  var result = '';
  var imgContent = '';
  var imgSidebar = '';
  if (imgs.length == 0) {
    imgs = [`${CLOUDINARY}admin/i_${storeType}_small_grey.png`];
  }
  for (var i = 0; i < imgs.length; i++) {
    imgUrl = CLOUDINARY + imgs[i];
    imgContent += `
    <div class="product-img-content" image-id="${imgs[i]}" ${((i == 0) ? '' : 'style="display:none;"')}>
      <div class="image-zoom-container">
        <img class="ui large image" onerror="this.src='${CLOUDINARY}admin/i_${storeType}_large_grey.png'" src="${imgUrl}" alt="${$.tools.escapeHtml(pData['nm'])}"/>
      </div>
    </div>`;

    imgSidebar += `
    <li class="product-img-carousel-item ${((i == 0) ? 'active' : '')}" image-id="${imgs[i]}">
      <img onerror="this.src='${CLOUDINARY}admin/i_${storeType}_small_grey.png'" src="${imgUrl}" alt="${$.tools.escapeHtml(pData['nm'])}">
    </li>`;
  }

  return '<div class="carousel-container"><div class="product-img-carousel-pre" onclick="preImageCarouselItem()"><i class="caret up icon"></i></div><ul class="product-img-carousel cu-scrollbar">' + imgSidebar + '</ul><div class="product-img-carousel-next" onclick="nextImageCarouselItem()"><i class="caret down icon"></i></div></div>' + imgContent;
}

function preImageCarouselItem() {
  var currentImageDom = $('.product-img-carousel-item.active');
  if (currentImageDom.prev().length != 0) {
    currentImageDom.prev().trigger('click');
  }
}

function nextImageCarouselItem() {
  var currentImageDom = $('.product-img-carousel-item.active');
  if (currentImageDom.next().length != 0) {
    currentImageDom.next().trigger('click');
  }
}

function addNoOption(pid) {
  if (!validateStock(pid)) {
    return false;
  }
  var i = 0;
  var found = false;
  var count = 0;
  for (i = 0; i < shoppingCart.length; i++) {
    if (shoppingCart[i]['pid'] == pid) {
      shoppingCart[i]['count']++;
      count = shoppingCart[i]['count'];
      found = true;
      break;
    }
  }
  if (!found) {
    var newP = {
      'pid': pid,
      'count': 1,
      'name': productFullData[pid]['nm'],
      'price': productFullData[pid]['pc'],
      'pt': ((productFullData[pid]['pt'] == undefined) ? 0 : productFullData[pid]['pt']),
    };
    shoppingCart.push(newP);
    count = 1;
  }
  // open shopping cart when add product
  $('.shop-cart').addClass('open');
  refreshProductCell(pid, count);
  refreshCartList();
  return true;
}

function removeNoOption(pid) {
  var i;
  var count = 0;
  for (i = 0; i < shoppingCart.length; i++) {
    if (shoppingCart[i]['pid'] == pid) {
      shoppingCart[i]['count']--;
      count = shoppingCart[i]['count'];
      if (count == 0) {
        shoppingCart.splice(i, 1);
      }
      break;
    }
  }
  refreshProductCell(pid, count);
  refreshCartList();
}

function addWithOption() {
  if (!validateStock(modalPickerId)) {
    return false;
  }
  var validateOptionResult = validateOption();
  if ($.isEmptyObject(validateOptionResult)) {
    if (pickerCount) {
      shoppingCart[pickerIndex]['count']++;
      pickerCount++;
    } else {
      pickerCount = 1;
      var opt = $.extend(true, {}, picker);
      var optionDetail = [];
      for (var optParent in opt) {
        var tempElementArray = [];
        for (var optElement in opt[optParent]) {
          tempElementArray.push(productFullData[modalPickerId]['opt'][optParent]['opts'][optElement]['nm']);
        }
        optionDetail.push({
          'nm': productFullData[modalPickerId]['opt'][optParent]['nm'],
          'opt': tempElementArray
        });
      }
      var newP = {
        'pid': modalPickerId,
        'count': 1,
        'name': productFullData[modalPickerId]['nm'],
        'price': pickerPrice,
        'pt': ((productFullData[modalPickerId]['pt'] == undefined) ? 0 : productFullData[modalId]['pt']),
        'opt': opt,
        'optionDetail': optionDetail,
      };
      pickerIndex = (shoppingCart.push(newP)) - 1;
    }
    refreshProductCell(modalPickerId);
    flyToCart($('.btn-add-with-option'));
  } else {
    alert(sprintf(trans[validateOptionResult.alert_text], validateOptionResult.alert_name, validateOptionResult.alert_amount), trans['alert_title']);
  }

  // open shopping cart when add product
  $('.shop-cart').addClass('open');
  refreshCartList();
}

function removeWithOptionButtonClick(pid) {
  var mutipleProduct = 0;
  for (var i = 0; i < shoppingCart.length; i++) {
    if (shoppingCart[i]['pid'] == pid) {
      mutipleProduct++;
      pickerIndex = i;
      pickerCount = shoppingCart[i]['count'];
    }
  }
  if (mutipleProduct == 1) {
    removeWithOption();
  } else if (mutipleProduct > 1) {
    alert(trans['alert_mutiple_option_product_delete']);
  } else {
    return;
  }
  refreshProductCell(pid);
}

function removeWithOption() {
  var pid = shoppingCart[pickerIndex]['pid'];
  if (pickerCount == 1) {
    shoppingCart.splice(pickerIndex, 1);
  } else {
    shoppingCart[pickerIndex]['count']--;
  }
  pickerCount--;
  refreshPickerSection();
  refreshCartList();

  var oldCount = $('.item-count[pid="' + pid + '"]').html();
  if (oldCount == 1) {
    oldCount = '';
    $('.btn-remove-with-option[pid="' + pid + '"]').hide();
  } else {
    oldCount = parseInt(oldCount);
    oldCount--;
  }
  $('.item-count[pid="' + pid + '"]').html(oldCount);
}

function removeFromCartBtn(index) {
  var count = shoppingCart[index]['count'];
  var pid = shoppingCart[index]['pid'];

  if (shoppingCart[index]['count'] == 1 || shoppingCart[index]['pt'] == 2) {
    //self input or count = 1
    shoppingCart.splice(index, 1);
  } else {
    shoppingCart[index]['count']--;
  }

  refreshProductCell(pid);
  refreshCartList();
}

function addFromCartBtn(index) {
  if (!validateStock(shoppingCart[index]['pid'])) {
    return false;
  }
  shoppingCart[index]['count']++;
  var count = shoppingCart[index]['count'];
  var pid = shoppingCart[index]['pid'];
  refreshProductCell(pid);
  refreshCartList();
}

function emptyCart() {
  var msg = trans['alert_empty_cart'];
  var title = trans['empty_cart'];
  confirm(msg, title, function() {
    shoppingCart = [];
    pickerPrice = productFullData[$data.productDetail.pid].pc;
    pickerIndex = -1;
    picker = {};
    $('#option-list .btn-option-selector').removeClass('active')
    modalPickerId = modalId;
    refreshCartList();
    $('.item-count').html('');
    $('.apply-coupon-button').removeClass('toggle active');
    $('.product-cell .button').hide();
    $('.button-holder').show();
    $('.btn-remove-no-option, .btn-add-no-option, .btn-remove-with-option, .btn-add-with-option').hide();
    store.coupon = '';
    store.coupon_pid = '';
    //save shopping cart and coupon to local storage
    var localData = {
      'shoppingCart': shoppingCart,
      'coupon': store.coupon,
      'coupon_pid': store.coupon_pid
    };
    saveToLocal('g' + groupId, localData);
  });
}

/**
 * [selfinputChange call when self input value has changed]
 * @return {[type]}          [description]
 */
function selfinputChange() {
  $('#modal-selfinput-button-wrap button').html('<i class="edit icon"></i>' + trans['confirm']);
  if (!/^\d+(?:\.\d{1,2})?$/.test($('#selfinput-input').val()) && $('#selfinput-input').val() != '') {
    $('#modal-selfinput-button-wrap button').removeClass('active toggle');
    $('#modal-selfinput-button-wrap button').addClass('disabled');
    return;
  }
  if (!$('#modal-selfinput-button-wrap button').is('.active.toggle')) {
    $('#modal-selfinput-button-wrap button').removeClass('disabled');
    $('#modal-selfinput-button-wrap button').addClass('active toggle');
  }
}

function selfinputConfirm() {
  if (!validateStock(modalId)) {
    return false;
  }
  $('#modal-selfinput-button-wrap button').html('<i class="edit icon"></i>' + '✓');
  $('#modal-selfinput-button-wrap button').removeClass('active toggle');
  $('#modal-selfinput-button-wrap button').addClass('disabled');
  var found = false;
  var emptyInput = $('#selfinput-input').val() == '' || $('#selfinput-input').val() == 0;

  for (var i = 0; i < shoppingCart.length; i++) {
    if (shoppingCart[i]['pid'] == modalId) {
      found = true;
      if (emptyInput) {
        shoppingCart.splice(i, 1);
      } else {
        shoppingCart[i]['count'] = $('#selfinput-input').val() * 100;
      }
      break;
    }
  }

  if (!found && !emptyInput) {
    var newP = {
      'pid': modalId,
      'count': $('#selfinput-input').val() * 100,
      'name': productFullData[modalId]['nm'],
      'price': 0.01,
      'pt': ((productFullData[modalId]['pt'] == undefined) ? 0 : productFullData[modalId]['pt']),
    };
    shoppingCart.push(newP);
  }

  if (emptyInput) {
    $('#selfinput-input').val('');
  } else {
    flyToCart($('#modal-selfinput-button-wrap'));
  }

  // open shopping cart when add product
  $('.shop-cart').addClass('open');
  refreshCartList();
  refreshProductCell(modalId);
}

function refreshSelfinputModal(pid) {
  var found = false;
  var i;
  for (i = 0; i < shoppingCart.length; i++) {
    if (shoppingCart[i]['pid'] == pid) {
      found = true;
      $('#selfinput-input').val(shoppingCart[i]['count'] * 0.01);
      break;
    }
  }

  if (!found) {
    $('#selfinput-input').val('');
  }
  selfinputChange();
  $('#modal-selfinput-button-wrap button').removeClass('active toggle');
  $('#modal-selfinput-button-wrap button').addClass('disabled');
}

function refreshProductCell(pid, count) {
  if (pid != productId) {
    return true;
  }

  if (pid == undefined) {
    console.log('refreshProductCell(): pid is not defined');
    return;
  } else if (productFullData[pid]['pt'] == 4) {
    //remove the active effect for coupon
    $('.apply-coupon-button[pid="' + pid + '"]').removeClass('toggle active');
    //coupon product
    if (productFullData[pid]['f1'] == store.coupon) {
      $('.apply-coupon-button[pid="' + pid + '"]').addClass('toggle active');
    }
    return;
  } else if (count == undefined) {

    if (productFullData[pid]['pt'] == undefined || productFullData[pid]['pt'] == 1 || productFullData[pid]['pt'] == 2) {
      if (!$.isEmptyObject(productFullData[pid]['opt'])) {
        //product with option
        count = 0;
        for (var i = 0; i < shoppingCart.length; i++) {
          if (shoppingCart[i]['pid'] == pid) {
            count += shoppingCart[i]['count'];
          }
        }
      } else {
        //product without option, giftcard or selfinput
        count = 0;
        for (i = 0; i < shoppingCart.length; i++) {
          if (shoppingCart[i]['pid'] == pid) {
            count = shoppingCart[i]['count'];
            break;
          }
        }
      }
    }
  }

  //handle selfinput
  if (productFullData[pid]['pt'] == 2) {
    if (count == 0) {
      $('.product-cell .self-input-button').html('<i class="edit icon"></i>' + trans['self_input']);
    } else {
      $('.product-cell .self-input-button').html('<i class="edit icon"></i>$' + count * 0.01);
    }
    return;
  }

  var removeBtnDom = $('.btn-remove-no-option[pid="' + pid + '"]');
  var addBtnDom = $('.btn-add-no-option[pid="' + pid + '"]');
  var itemCountDom = $('.item-count[pid="' + pid + '"]');
  if (productFullData[pid]['opt'] && productFullData[pid]['opt'].length != 0) {
    //product with option
    removeBtnDom = $('.btn-remove-with-option[pid="' + pid + '"]');
    addBtnDom = $('.btn-open-option-picker[pid="' + pid + '"]');
  }


  //refresh dom
  if (productFullData[pid]['pt'] == undefined || productFullData[pid]['pt'] == 1) {
    if (productFullData[pid]['opt'] && productFullData[pid]['opt'].length != 0) {
      /**
       * for normal product with option
       */
      refreshPickerSection();
    } else {
      /**
       * for normal product without option
       */
      if (count > 0) {
        removeBtnDom.show();
        itemCountDom.html(count);
        addBtnDom.show();
        addBtnDom.next().hide();
      } else {
        removeBtnDom.hide();
        itemCountDom.html('');
        addBtnDom.hide();
        addBtnDom.next().show();
      }
    }
  }
}

function refreshPickerSection() {
  pickerCount = checkOptionItemCount();
  if (pickerCount == 0) {
    $('#product-option .item-count').html('');
    $('#product-option .btn-remove-with-option, #product-option .btn-add-with-option').hide();
    $('#product-option .button-holder').show();
  } else {
    $('#product-option .item-count').html(pickerCount);
    $('#product-option .btn-remove-with-option, #product-option .btn-add-with-option').show();
    $('#product-option .button-holder').hide();
  }
}

function refreshTopNav() {
  if (store.is_login) {
    //default refresh
    $('#user-login').hide();
    $('#user-name').html(store.nickname);
    $('#user-option').show();
  } else {
    $('#user-login').show();
    $('#user-option').hide();
  }
}

//function called by login() after login
function refreshLogin(nickName) {
  store.is_login = true;
  store.nickname = nickName;
  refreshTopNav();
}

function refreshLogout() {
  store.is_login = false;
  refreshTopNav();
}

function flyToCart(thisObj) {
  var flyer = $('<div class="flyer" hidden></div>').appendTo('body');
  flyer.show();
  flyer.css({
    'position': 'absolute',
    'z-index': '1050',
    'width': '25px',
    'height': '25px',
    'border-radius': '100%',
    'border': '0',
    'background-image': `url(${CLOUDINARY}image/upload/v1480380858/admin/i_plus.png)`,
    'background-size': '25px',
    'background-position': 'center',
    'background-repeat': 'no-repeat',
    'left': $(thisObj).offset().left,
    'top': $(thisObj).offset().top
  });

  var cart = $('.shop-cartfooter');
  flyer.animate({
    'top': [cart.offset().top - 20, 'easeInExpo'],
    'left': [cart.offset().left + 35, 'linear'],
  }, {
    duration: 350,
    queue: false,
    complete: function() {
      flyer.remove();
    }
  });
}

function addProductHistory(pid) {
  addFootprint({
    's_id': groupId,
    's_nm': store.nm,
    's_addr': store.s_addr,
    's_phone': store.phone,
    's_img': CLOUDINARY + 'f_auto,q_auto/' + store.img,
    's_rating': store.s_rating,
    's_cid': cid,
    'p_info': {
      'p_id': pid,
      'p_nm': productFullData[pid]['nm'],
      'p_rating': productFullData[pid]['rat'],
      'p_img': CLOUDINARY + 'f_auto,q_auto/' + productFullData[pid]['iurl'],
      'p_pc': productFullData[pid]['pc'],
      'p_old_price': productFullData[pid]['old_price'],
    }
  }).done(function(res) {
    console.log(res);
  });
}

function pointsInfo() {
  var info = 'The displayed reward points amount is a rough calculation, the actual reward points you will receive will be verified by the merchant upon completing the order.';
  toast({
    text: info,
    style: 'weixin__text',
    duration: 4000
  });
}

function setSearch() {
  var currentCid = $('.top-search-tab.active').attr('data-value');
  if (currentCid == 3) {
    window.location.href = '/store/?cid=3&gid=431';
    return;
  }

  var redirectUrl = '/' + CATEGORIES_MAPPING[currentCid] + '/?';
  if ($('#input-keyword').val() != "") {
    redirectUrl += 'searchKey=' + $('#input-keyword').val() + '&';
  }

  if ($('#input-location').val() != "") {
    redirectUrl += 'searchLocation=' + $('#input-location').val();
  }

  window.location.href = redirectUrl;
  return;
}

// google service & location

var displaySuggestions = function(predictions, status) {
  if (status != google.maps.places.PlacesServiceStatus.OK) {
    //alert(status);
    return;
  }
  var menu = '<div class="item" data-value="current"><i class="home icon"></i>' + trans['current_location'] + '</div>';
  predictions.forEach(function(prediction) {
    menu += '<div class="item" data-value="' + prediction.description + '"><i class="marker icon"></i>' + prediction.description + '</div>';
  });
  $('#menu-location').html(menu);
};

function restoreLocation() {
  var menu = '<div class="item" data-value="current"><i class="home icon"></i>' + trans['current_location'] + '</div>';
  var list = JSON.parse(localStorage.getItem('location'));
  if (list != null) {
    for (var i = 0; i < list.length; i++) {
      menu += '<div class="item" data-value="' + list[i] + '"><i class="history icon"></i>' + list[i] + '</div>';
    }
  }
  $('#menu-location').html(menu);
}

function setLatlon() {
  var value = $('#input-location').val();
  if (value == 'current' || value == '') {
    currentLocation();
    refreshList();
  } else {
    $.ajax({
      url: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + value + '&key=AIzaSyDjJS7UCMs8XDZX7eS38CXEXUuFu3O6xnA',
      type: "GET",
      dataType: "json",
      error: function() {}
    }).done(function(res) {
      if (res['status'] == 'OK') {
        var data = res['results'][0]['geometry']['location'];
        selector['latlon'] = data['lat'] + ',' + data['lng'];
      } else {
        currentLocation();
      }
      refreshList();
    });
  }
}

function currentLocation() {
  if (currentLatlon) {
    selector['latlon'] = currentLatlon;
  } else {
    selector['latlon'] = '';
  }
}

function addLocationHistory(name) {
  if (name != 'current' && name != '') {
    var list = JSON.parse(localStorage.getItem('location'));
    if (list == null) {
      list = [name];
    } else if ($.inArray(name, list) == -1) {
      list.push(name);
    }
    if (list.length > 5) {
      list.spice(0, 1);
    }
    localStorage.setItem('location', JSON.stringify(list));
  }
}

function toggleOptionArea() {
  $('#option-area-wrap').toggleClass('active');
  if ($('#option-area-wrap').is('.active')) {
    $('#option-area-wrap').find('#option-list-read-more span').text('-');
    $('#option-area-wrap').find('#option-list-read-more i').removeClass('down').addClass('up');
  } else {
    $('#option-area-wrap').find('#option-list-read-more span').text('+');
    $('#option-area-wrap').find('#option-list-read-more i').removeClass('up').addClass('down');
  }
}

function seeMoreProductDetail() {
  $('body,html').animate({
    scrollTop: $('#product-desc-wrap').offset().top,
  }, 800);
}

$(document).ready(function() {
  
  if (cid == 2) {
    storeType = 'groupsale';
  } else if (cid == 3) {
    storeType = 'travel';
  } else if (cid == 4) {
    storeType = 'shopping';
  } else if (cid == 5) {
    storeType = 'service';
  }

  initProduct();
  loadProductReview(productId, 1, '#product-comment-list');

  refreshTopNav();

  google_service = new google.maps.places.AutocompleteService();
  restoreLocation();

  // auto fill shippingMethod
  setTimeout(function(){
    $('.shipping-dropdown').dropdown('set selected', getFromLocal('checkoutShippingMethod'));
    $('.shipping-dropdown').dropdown('setting', 'onChange', function(val){
      refreshCartList();
    });
  }, 0);

  //add event listener
  // event listeners
  //for search bar
  //.top-search-tab listener
  $('.top-search-tab').on('click', function(event) {
    event.preventDefault();
    /* Act on the event */
    $('.top-search-tab').removeClass('active');
    $(this).addClass('active');
    $('#input-keyword').attr('placeholder', $(this).html());
  });

  $('#btn-search').on('click', function(event) {
    event.preventDefault();
    /* Act on the event */
    setSearch();
  });


  $('input.search').on('keyup', function() {
    if (!$(this).val()) {
      restoreLocation();
    } else {
      google_service.getQueryPredictions({
        input: $(this).val()
      }, displaySuggestions);
    }
  });


  $('.main-container .right-wrap').on('click', '.button-holder', function() {
    if ($(this).prev().is('.button')) {
      $(this).prev().trigger('click');
    }
  });

  $('.btn-share').on('click', function() {
    share($(this));
  });

  $('.main-container .right-wrap').on('click', '.apply-coupon-button', function() {
    if ($(this).attr('pid') != store.coupon_pid) {
      store.coupon_pid = '';
      store.coupon = '';
      $('.apply-coupon-button').removeClass('toggle active');
    }

    if ($.isEmptyObject(store.coupon)) {
      store.coupon_pid = $(this).attr('pid');
      store.coupon = productFullData[$(this).attr('pid')]['f1'];
      $('.apply-coupon-button[pid="' + $(this).attr('pid') + '"]').addClass('toggle active');
    } else {
      $('.apply-coupon-button').removeClass('toggle active');
      store.coupon = '';
      store.coupon_pid = '';
    }
    //save shopping cart and coupon to local storage
    var localData = {
      'shoppingCart': shoppingCart,
      'coupon': store.coupon,
      'coupon_pid': store.coupon_pid
    };
    saveToLocal('g' + groupId, localData);
  });

  $('.main-container .right-wrap').on('click', '.btn-add-no-option', function() {
    if (addNoOption($(this).attr('pid'))) {
      flyToCart($(this));
    }
  });

  $('.main-container .right-wrap').on('click', '.btn-remove-no-option', function() {
    removeNoOption($(this).attr('pid'));
  });

  $('.main-container .right-wrap').on('click', '.btn-remove-with-option', function() {
    removeWithOptionButtonClick($(this).attr('pid'));
  });

  $('#cart-list').on('click', '.btn-cart-minus', function() {
    removeFromCartBtn($(this).attr('index'));
    return false;
  });

  $('#cart-list').on('click', '.btn-cart-plus', function() {
    addFromCartBtn($(this).attr('index'));
    return false;
  });

  $('#option-list').on('click', '.btn-option-selector', function() {
    var parentId = $(this).parent().parent().attr('optid');
    var optionId = $(this).attr('optid');
    var opt = productFullData[modalPickerId]['opt'][parentId];
    var optData = opt['opts'][optionId];
    var imgIndex = $(this).attr('img-index');
    if ($.isNumeric(imgIndex)) {
      // toggle related image
      $('.product-img-carousel-item:nth-child(' + imgIndex + ')').trigger('click');
    }

    if ($(this).hasClass('active')) {
      $(this).removeClass('active');
      delete picker[parentId][optionId];
      if (!Object.keys(picker[parentId]).length) {
        delete picker[parentId];
      }
      pickerPrice -= optData['pc'];
    } else {
      var max = opt['max'];
      var flag = false;
      if (!picker[parentId]) {
        picker[parentId] = {};
        flag = true;
      } else {
        if (max > Object.keys(picker[parentId]).length) {
          flag = true;
        } else if (max == 1) {
          flag = true;
          pickerPrice -= $(this).parent().children('.active').attr('pc');
          $(this).parent().children().removeClass('active');
          picker[parentId] = {};
        } else {
          toast({
            text: trans['alert_maximum_option_select'],
            style: 'weixin__text',
          });
        }
      }
      if (flag) {
        picker[parentId][optionId] = {
          'nm': optData['nm']
        };
        $(this).addClass('active');
        pickerPrice += optData['pc'];
      }
    }
    refreshPickerSection();
    $('#product-price').html(currencySymbol + round(pickerPrice, 2));
  });

  //toggle shopping cart
  $('.shop-cartfooter').on('click', '.shop-clickable', function() {
    $('.shop-cart').toggleClass('open');
  });

  //image carousel for product modal
  $('.main-container').on('click', '.product-img-carousel-item', function() {
    $('.product-img-carousel-item').removeClass('active');
    $(this).addClass('active');
    currentImg = $(this).attr('image-id');
    $('.product-img-content').hide();
    $('.product-img-content[image-id="' + $(this).attr('image-id') + '"]').show();
  });

  $('#gallery').on('mouseenter', '.image-zoom-container', function() {
    $(this).closest('.product-img-content').imageZoom({
      imageContainerClass: 'image-zoom-container',
      width: 495,
      height: 495
    });
  });

  //product pagination
  $('.comment-pagination').on('click', '.product-pagination', function() {
    if ($(this).is('.disabled')) {
      return;
    }
    loadProductReview($(this).attr('pid'), $(this).attr('data-page'), $(this).attr('data-comment-selector'));
  });

  //initial modal
  $('.ui.modal')
    .modal({
      duration: 200,
      selector: {
        close: '.remove.icon',
      }
    });

  //initial shipping drop down
  $('.shipping-dropdown').dropdown({
    direction: 'upward'
  });

  //select default shipping method
  $('.shipping-dropdown-item:nth-child(1)').trigger('click');

  //initial #btn-checkout
  if (!store.has_payment || !store.has_shipping) {
    $('#btn-checkout').html(trans['not_ready']);
    $('#btn-checkout').prop('onclick', '');
    $('#btn-checkout').prop('id', '');
  } else if (!store.is_member) {
    $('#btn-checkout').html(trans['not_member']);
    $('#btn-checkout').prop('onclick', '');
    $('#btn-checkout').prop('id', '');
  }

  //.write-review listener
  $('#modal-post-review').on('keyup', 'textarea', function() {
    if ($(this).val() != '' && $('#modal-post-review .ui.rating').rating('get rating') != 0) {
      $('#modal-post-review .post-button').removeClass('disabled');
    } else {
      $('#modal-post-review .post-button').addClass('disabled');
    }
  });

  $('.write-review').on('click', function(e) {
    e.preventDefault();
    var thisObj = $(this);
    if (store.is_login) {
      $('#modal-post-review').modal({
          inverted: true,
          selector: {
            close: '.cancel-button',
            approve: '.post-button',
          },
          onShow: function () {
            $('#modal-post-review .author').html(store.nickname);
            $('#modal-post-review textarea').val('');
            $('#modal-post-review .post-button').addClass('disabled');
            //hehe
            img_count=0;
            $('.img_upload_area').html(`<div class="single_img">
            <label for="upload_img_0" class="img_label" id="img_label_0">
            <img src="http://goo.gl/pB9rpQ"/>
            </label>
            <input type="file" class="upload_img" id="upload_img_0" style="display:none"/>
            <img class="upload_img_preview" id="img_preview_0" src="#" alt="your image" style="display:none"/>
            </div>`);
            $('#modal-post-review .ui.rating').rating({
              onRate: function (value) {
                if ($('#modal-post-review textarea').val() != 0) {
                  $('#modal-post-review .post-button').removeClass('disabled');
                } else {
                  $('#modal-post-review .post-button').addClass('disabled');
                }
              }
            });
          },
          onApprove: function() {
            postReview({
              "action": thisObj.attr('data-action'),
              "pid": parseInt(thisObj.attr('data-id')),
              "id": groupId,//asd
              "name": store.nickname,
              "product_rating": $('#modal-post-review .ui.rating').rating('get rating'),
              "comment": $('#modal-post-review textarea').val(),
              "imgs": [],
            },2).done(function(res) {
              if (res['RC'] == 200) {
                toast({
                  text: trans['alert_review_succeed'],
                  style: 'weixin'
                });
              } else {
                toast({
                  text: trans['alert_fail_communicate'],
                  style: 'weixin'
                });
              }

              //clear cache for product modal and comment
              if (thisObj.attr('data-action') == 'post_product_review') {
                productCommentCache = {};
                loadProductReview(productId, 1, '#product-comment-list');
              }
            });
          },
        })
        .modal('show');
    } else {
      toast({
        text: trans['review_need_signin'],
        style: 'weixin__text',
      });
    }
  });

  //hehe

  $('#modal-post-review').on('keyup', 'textarea', function () {
    if ($(this).val() != '' && $('#modal-post-review .ui.rating').rating('get rating') != 0) {
      $('#modal-post-review .post-button').removeClass('disabled');
    } else {
      $('#modal-post-review .post-button').addClass('disabled');
    }
  });

  //hehe
  function readURL(input) {
    if (input.files && input.files[0]) {

        var preview = $('#img_preview_'+img_count+'.upload_img_preview');
        var file = input.files[0];
        var reader  = new FileReader();

        reader.onload = function () {
          preview.attr('src',reader.result);
        };

        if (file) {
          reader.readAsDataURL(file);
        }

        $('#img_preview_'+img_count+'.upload_img_preview').attr('style', 'display:block');
        $('#img_label_'+img_count+'.img_label').attr('style', 'display:none');

        img_count++;
        if(img_count<=2){
          var html=`<div class="single_img">
          <label for="upload_img_${img_count}" class="img_label" id="img_label_${img_count}">
          <img src="http://goo.gl/pB9rpQ"/>
          </label>
          <input type="file" class="upload_img" id="upload_img_${img_count}" style="display:none"/>
          <img class="upload_img_preview" id="img_preview_${img_count}" src="#" alt="your image" style="display:none"/>
          </div>`;
          $('.img_upload_area').append(html);
        }
    }
  }
  
  //hehe
  $("#modal-post-review").on('change','.upload_img',function(){
    readURL(this);
  });




  //hehe

  $('#related-products-wrap').on('click', '.cu-tab', function() {
    $('#related-products-wrap').find('.cu-tab, .cu-tab-content').removeClass('active');
    $(this).addClass('active');
    $('#' + $(this).attr('tab-data')).addClass('active');
  });

  $('#related-products, #recent-viewed-history').on('click', '.cu-link', function() {
    window.location = $(this).attr('href');
  });

  $(".product-short-desc").dotdotdot({
    height: 100,
    after: '.store-see-details',
    wrap: 'letter',
  });

  //add listener for product count input except selfinput
  $('#cart-list').on('change', 'input.item-count', function() {
    var tempCount = (isNaN(parseInt($(this).val())) || parseInt($(this).val()) <= 0) ? 1 : parseInt($(this).val());
    var tempShoppingCart = $.extend(true, [], shoppingCart);
    tempShoppingCart[$(this).attr('data-index')].count = tempCount;

    if (validateStock(shoppingCart[$(this).attr('data-index')].pid, tempShoppingCart)) {
      shoppingCart[$(this).attr('data-index')].count = tempCount;
    }

    refreshCartList();
  });
});
