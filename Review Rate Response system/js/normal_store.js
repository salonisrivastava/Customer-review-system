var productFullData = {};
var productFullIndexData = [];
var productFilterData = [];
var modalId;
var modalPickerId;
var shoppingCart = [];
var pickerPrice = 0;
var pickerCount = 0;
var pickerIndex = -1;
var picker = {};
var reviewPage = 0;
var firstReview = true;
var productCommentCache = {};
var giftcardOnly = true;
var ggshareId = 'ggshare-noopt';
var map;
var reviewInitialized = false;//hehe
var max_review_pagination = 2;//hehe
var review_per_page = 10;//hehe pagination
var total_review_pages;//hehe
var img_count = 0; //hehe


function uploadImage() {
  console.log('uploadimage triggered');
  var data = {
    action: 'upload_image',
    type: 'POST',
    data: {}
  };

  return $.ajax({
    url: "/oauth/",
    type: "POST",
    data: data,
    dataType: "json",
    beforeSend: function () { },
    error: function () {

    }
  });
}


function round(x, digits) {
  x = Number(x).toFixed(digits);
  if (x == 0) {
    x = 0;
  }
  return x;
}

function seeStoreDesc() {
  toggleTab('store');
  $('body,html').animate({
    scrollTop: $('body')[0].scrollHeight,
  }, 800);
  $('#switcher .item').removeClass('active');
  $('#switcher > div > div > div > a:nth-child(2)').addClass('active');
}

function refreshPage() {
  //initial rating (also need to initial when dom has changed)
  $('.rating').rating('disable');
  if (store.show_product_place_holder_image) {
    addImageErrorListener({
      errorImage: CLOUDINARY + `admin/i_${storeType}_small_grey.png`,
    });
  } else {
    removeImageOnError();
  }


  //refresh
  $('.cat-section').visibility('refresh');
  $('#comment-list').visibility('refresh');
  if (Object.keys(productFullData).length > 8) {
    $('#cat-buttons.ui.sticky').sticky('refresh');
    //initial cat button sticky
    $('#cat-buttons.ui.sticky')
      .sticky({
        context: '#cat-section-wrap',
        onStick: function () {
          if ($(window).width() >= 1440) {
            $(this).addClass('on-stick');
            $('#cat-buttons').css({
              'width': 'auto',
              'height': 'auto',
              'left': 'auto',
              'margin-left': -165,
            });
          }
        },
        onUnstick: function () {
          $(this).removeClass('on-stick');
          $(this).css({
            'margin-left': 'auto',
          });
        }
      });
  }
  createInfoBar();
}

function toggleStyle(style) {
  $('#change-style-buttons button').removeClass('active');
  if (style == 'gird') {
    store.product_list_style = 'gird';
    $('#change-style-gird').addClass('active');
  } else if (style == 'list') {
    store.product_list_style = 'list';
    $('#change-style-list').addClass('active');
  }
  createProductList(productFilterData);
  refreshPage();
}

function toggleTab(type) {
  if (type == store.current_product_tab && type != 'product' && type != 'search') {
    return;
  }
  $('.tab-toggle').hide();
  $('.tab-' + type).show();
  store.current_product_tab = type;
  //show hide shopping cart for when not store and not search
  if (type != 'search' && type != 'product') {
    $('.shop-cart, .shop-cartfooter, .sorting, #change-style-buttons').hide();
    if (type == 'review') {
      firstReview = false;
    }
  } else {
    $('.shop-cart, .shop-cartfooter, .sorting, #change-style-buttons').show();
    $('.sorting').removeClass('active');
    $('#sorting-default').addClass('active');
    $('.sorting .icon').removeClass('up').addClass('down');
  }

  if (type == 'product') {
    $('#search-input').val('');
    $('.sorting').removeClass('active');
    $('.sorting .icon').removeClass('up').addClass('down');
    $('#sorting-default').addClass('active');
    if (store.current_product_tab == 'product' || store.current_product_tab == 'search') {
      productFilterData = $.extend(true, [], productFullIndexData);
      generateProductFilterData();
      createProductList(productFilterData);
    }
    store.current_product_tab = 'product';
  } else if (type == 'contact') {
    refreshCaptcha();
  }
  refreshPage();

  //change url when is independent domain
  if (store.independent_domain) {
    var urlParams = $.tools.getUrlParameters();
    var currentTabUrl = Object.keys(TOGGLE_TAB_MAPPING)[Object.values(TOGGLE_TAB_MAPPING).indexOf(type)];
    var newUrl = '/';
    if (!currentTabUrl && type !== 'product') { //if newUrl is undefined, means there is no related tab for current type annd currenttype is not product
      return;
    }
    if (type !== 'product') {
      newUrl = `/page/${currentTabUrl}`;
    }

    newUrl += (Object.keys(urlParams).length === 0) ? '' : '?';
    Object.keys(urlParams).map(function (key) {
      newUrl += key + '=' + urlParams[key] + '&';
    });

    if (history.replaceState) {
      history.replaceState(null, null, newUrl);
    }
  }
}

// function loadReview() {
//   //if current is loading, return
//   if ($('#comment-list .loader').length != 0) {
//     return;
//   }
//   //if no more review devider is in #comment-list, return
//   if ($('#comment-list .nomore-divider').length != 0) {
//     return;
//   }

//   reviewPage++;
//   var url = DOMAIN + '/api/v6/sreview?gId=' + groupId + '&page=' + reviewPage + '&limit=20';
//   $('#comment-list').append('<div class="ui active centered inline loader"></div>');
//   $.ajax({
//     type: "GET",
//     url: url,
//     dataType: "json",
//   }).done(function(res) {
//     //remove loader and determain if it is no more review
//     $('#comment-list .loader').remove();
//     if (res['RC'] == 200) {
//       if (res['records'].length == 0) {
//         $('#comment-list').append('<h4 class="ui horizontal divider header nomore-divider">' + trans['no_more_review'] + '</h4>');
//         return;
//       }
//       var html = createReviewList(res['records'], true);
//       $('#comment-list').append(html);
//       $('.rating').rating('disable');
//     }
//   });
// }
function loadReview() {
  //if current is loading, return
  // if ($('#comment-list .loader').length != 0) {
  //   return;
  // }
  //if no more review devider is in #comment-list, return
  // if ($('#comment-list .nomore-divider').length != 0) {
  //   return;
  // }
  if (!reviewInitialized)
    reviewPage = 1;

  var url = DOMAIN + '/api/v7/s_review?gid=' + groupId + '&page=' + reviewPage + '&limit=' + review_per_page;
  // $('#comment-list').append('<div class="ui active centered inline loader"></div>');
  $.ajax({
    type: "GET",
    url: url,
    dataType: "json",
  }).done(function (res) {
    //remove loader and determain if it is no more review
    $('#comment-list .loader').remove();
    if (res['RC'] == 200) {
      if (res['records'].length == 0) {
        $('#comment-list').append('<h4 class="ui horizontal divider header nomore-divider">' + trans['no_more_review'] + '</h4>');
        return;
      }

      if (!reviewInitialized) {
        var total_reviews = res['paging']['total'];

        total_review_pages = Math.ceil(total_reviews / review_per_page);
        $('.review-pagination').append(`<a class="disabled rwlst-previous">&lt;</a>`);
        for (var i = 1; i <= total_review_pages; i++) {
          if (i == 1)
            $('.review-pagination').append(`<a class="active rwlst-paging" page=${i}>${i}</a>`);
          else {
            if (i > 1 && i <= max_review_pagination) {
              $('.review-pagination').append(`<a class="rwlst-paging" page=${i}>${i}</a>`);
            }
            else
              $('.review-pagination').append(`<a class="rwlst-paging hidden-paging" page=${i}>${i}</a>`);
          }
        }
        if (total_review_pages > max_review_pagination)
          $('.review-pagination').append(`<span class="rate-page-break" style="font-size:16px;font-weight:500"> ... </span>`);

        $('.review-pagination').append(`<a class="rwlst-next">&gt;</a>`);

        if (total_review_pages == 1) {
          $('.rwlst-next').prop("disabled", true);
          $('.rwlst-next').addClass("disabled");
        }
        reviewInitialized = true;
      }

      var html = createReviewList(res['records'], true);
      $('#comment-list').html('');
      $('#comment-list').append(html);
      $('.rating').rating('disable');
    }
  });
}


function loadProductReview(pid, page, commentSelector) {
  var url = DOMAIN + '/api/v7/p_review?pid=' + pid + '&page=' + page + '&limit=3';
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
      beforeSend: function () {

      }
    }).done(function (res) {
      if (res['RC'] == 200) {
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
  var writeReviewHtml =
    '<button class="ui button write-review" data-action="post_product_review" data-id="' + pid + '"><i class="star icon"></i><a>' + trans['write_a_review'] + '</a></button>';

  if (commentDom.prev().find('.write-review').length == 0) {
    //ui header modal-header
    commentDom.prev().append(writeReviewHtml);
  }

  if (productCommentCache.pages[page].length == 0) {
    commentDom.html('<div class="comment">' + trans['no_review'] + '</div>');
    commentDom.next().html('');
    return;
  }
  var html = createReviewList(productCommentCache.pages[page], false);
  commentDom.next().html(createPagination(pid, page, productCommentCache.total, 3, commentSelector));
  commentDom.html(html);
  $('.rating').rating('disable');
}

function createReviewList(reviewData, isStore) {
  var result = '';
  var i, review;
  for (i = 0; i < reviewData.length; i++) {
    review = reviewData[i];
    var rate;
    if (review['s_review'] != undefined) {
      if (review['s_review']['general'] != undefined)
        rate = review['s_review']['general']['rat'];
    }
    else {
      rate = review['rat'];
    }
    var image = '';
    var divider = '<div class="ui divider"></div>';

    
    // if (isStore) {
    //   image = '\
    //   <a class="avatar">\
    //     <img src="' + CLOUDINARY + 'image/upload/v1487613621/admin/avatar.png">\
    //   </a>';
    //   divider = '';
    // }
    // else{
      image = '\
      <a class="avatar">\
        <img src="' + CLOUDINARY + review['avatar'] + '>\
      </a>';
    // }
    result += divider + '\
    <div class="comment">\
      ' + image + '\
      <div class="content">\
        <a class="author">' + review['author'] + '</a>\
        <div class="metadata"><span class="date">' + timeToLocal(review['review_dt']) + '</span></div>\
        <div class="actions">\
          <a class="reply"><div class="ui small star rating" data-rating="' + Math.round(rate) + '" data-max-rating="5"></div></a>\
        </div>\
        <div class="text">' + review['cmt'] + '</div>\
      </div>\
    </div>';
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
        for (var i = 1; i <= 4; i++) {
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
        for (i = currentCount + 1; i <= totalPage; i++) {
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

function createProductList(productDataList) {
  $('.cat-section-title').hide();
  $('.cat-section-content').html('').hide();
  if (store.filter_group_by_categories && store.current_product_tab == 'product') {
    //show product tab
    $('.cat-button').hide();
    for (var key in productDataList) {
      var productData = productDataList[key];
      var productCell = createProductCell(productData);
      var catIds = productData['ctids'];
      for (var j = 0; j < catIds.length; j++) {
        $('#cat-' + catIds[j]).append(productCell);
      }
    }

    if (store.current_product_tab == 'product') {
      //remove loder for product wrap
    }


    if (store.filter_current_cats) {
      //if it has multimenu
      $.each(store.filter_current_cats, function (index, value) {
        $('#cat-title-' + value).show();
        $('#cat-' + value).show();
        $('#cat-' + value + '-button').show();
      });
    } else {
      $('.cat-button, .cat-section-title, .cat-section-content').show();
    }

    $('#cat-section-content-wrap').show();
    $('.product-tab-without-cat').hide();
    $('.product-tab-with-cat').show();
    $('#cat-section-wrap .loader').remove();
    refreshPage();
    initCart();

  } else {
    if (store.current_product_tab == 'search') {
      $('#search-result-content').html('');
      for (key in productDataList) {
        productData = productDataList[key];
        productCell = createProductCell(productData);
        $('#search-result-content').append(productCell);
        refreshProductCell(productData['pid']);
      }
      $('#search-result-content').show();
    } else if (store.current_product_tab == 'product') {
      $('#product-result-content').html('');
      for (key in productDataList) {
        productData = productDataList[key];
        productCell = createProductCell(productData);
        $('#product-result-content').append(productCell);
        refreshProductCell(productData['pid']);
      }
      $('.product-tab-without-cat').show();
      $('.product-tab-with-cat').hide();
    }
  }
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
  //if muti menu
  if ($('.filter-menu-dropdown .cu-input.dropdown').length != 0) {
    if ($('.cat-menu.is-active .child.checkbox').find('input:checked').length == 0) {
      alert(trans['alert_choose_categories']);
      return false;
    }
  }
  return true;
}

function validateOption() {
  var allResult = [];
  var optData = productFullData[modalPickerId]['opt'];
  var opt;
  var currentSelectCount = 0;
  for (var opt in optData) {

    if (picker[opt]) {
      currentSelectCount = Object.keys(picker[opt]).length;
    } else {
      currentSelectCount = 0;
    }
    var result = {};
    if (optData[opt]['min'] == optData[opt]['max'] && optData[opt]['max'] == 1 && currentSelectCount != 1) {
      result.alert_name = optData[opt]['nm'];
      result.alert_type = 'min-max-1';
      result.alert_text = 'alert_option_mandatory_one';
      result.alert_amount = optData[opt]['min'];
      allResult.push(result)
      continue;
    }

    if (currentSelectCount < optData[opt]['min']) {
      result.alert_name = optData[opt]['nm'];
      result.alert_type = 'min';
      result.alert_text = 'alert_option_minimum_pick';
      result.alert_amount = optData[opt]['min'];
      allResult.push(result)
      continue;
    }
    if (currentSelectCount > optData[opt]['max']) {
      result.alert_name = optData[opt]['nm'];
      result.alert_type = 'max';
      result.alert_text = 'alert_option_maximum_pick';
      result.alert_amount = optData[opt]['max'];
      allResult.push(result)
      continue;
    }
  }

  return allResult;
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
  if (modalId == pid) {
    refreshNoOptionModal(pid, count);
  }
  refreshProductCell(pid, count);
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
  refreshPickerModal();
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
  refreshOptionModal(pid);
}

function emptyCart() {
  if (shoppingCart.length != 0) {
    var msg = trans['alert_empty_cart'];
    var title = trans['empty_cart'];
    confirm(msg, title, function () {
      shoppingCart = [];
      pickerPrice = 0;
      pickerCount = 0;
      pickerIndex = -1;
      picker = {};
      modalPickerId = 0;
      refreshCartList();
      $('.item-count').html('');
      $('.apply-coupon-button').removeClass('toggle active');
      $('.product-cell .button').hide();
      $('.button-holder').show();
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

  //refresh
  if ($.isEmptyObject(productFullData[pid]['opt']) && productFullData[pid]['pt'] != 2) {
    refreshProductCell(pid, count - 1);
  } else {
    refreshProductCell(pid);
  }
  refreshCartList();

  if (modalId == pid) {
    refreshModals(pid);
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
  localStorage.removeItem('storelogin');
  store.is_login = true;
  store.nickname = nickName;
  refreshBookmark();
  refreshTopNav();
}

function refreshLogout() {
  store.is_login = false;
  refreshBookmark();
  refreshTopNav();
}

/**
 * [selfinputChange call when self input value has changed]
 * @return {[type]}          [description]
 */
function selfinputChange() {
  $('#modal-selfinput-button-wrap button').text(trans['confirm']);
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

function refreshBookmark() {
  if (store.is_login) {
    store.bookmarks = getFromLocal('bs');
  } else {
    removeFromLocal('bs');
    store.bookmarks = [];
  }
  if (!store.bookmarks) {
    store.bookmarks = [];
  }
  if (store.bookmarks && store.bookmarks.indexOf(groupId) != -1) {
    $('#store-bookmark, #store-bookmark i').addClass('remove');
    $('#store-bookmark .label').html(trans['unlike']);
  } else {
    $('#store-bookmark, #store-bookmark i').removeClass('remove');
    $('#store-bookmark .label').html(trans['like']);
  }
}

function toggleBookmark() {
  if (!store.is_login) {
    alert(trans['alert_login']);
    return;
  }
  var storeBookmarkFlag = (store.bookmarks && store.bookmarks.indexOf(groupId) != -1);
  var data = {};
  if (storeBookmarkFlag) {
    //store is bookmarked
    data = {
      type: 'POST',
      action: 'remove_bookmark',
      data: {
        "c_id": categoryId,
        "g_id": groupId,
        "del": 1
      }
    };
  } else {
    //store is not bookmarked
    data = {
      type: 'POST',
      action: 'add_bookmark',
      data: {
        "c_id": categoryId,
        "g_id": groupId
      }
    };
  }

  $.ajax({
    url: "/oauth/",
    type: "POST",
    data: data,
    dataType: "json",
    error: function () { }
  }).done(function (data) {
    if ($.tools.checkResponse(data)) {
      if (storeBookmarkFlag) {
        for (var i = 0; i < store.bookmarks.length; i++) {
          if (store.bookmarks[i] == groupId) {
            store.bookmarks.splice(i, 1);
          }
        }
        $('#store-bookmark, #store-bookmark i').removeClass('remove');
        $('#store-bookmark .label').html(trans['like']);
      } else {
        store.bookmarks.push(groupId);
        $('#store-bookmark, #store-bookmark i').addClass('remove');
        $('#store-bookmark .label').html(trans['unlike']);
      }
      saveToLocal('bs', store.bookmarks);
    } else if (data['RC']) {
      toast({
        text: 'You has been log out!',
        style: 'weixin__text',
        callback: function () {
          window.location.reload();
        }
      });
    }
  });
}

function preImageCarouselItem() {
  var currentImageDom = $('.modal-img-carousel-item.active');
  if (currentImageDom.prev().length != 0) {
    currentImageDom.prev().trigger('click');
  }
}

function nextImageCarouselItem() {
  var currentImageDom = $('.modal-img-carousel-item.active');
  if (currentImageDom.next().length != 0) {
    currentImageDom.next().trigger('click');
  }
}

function resizeButtonHolder() {
  var maxWidth = 0;
  $('.product-cell .button-holder').each(function () {
    if ($(this).outerWidth() > maxWidth) {
      maxWidth = $(this).outerWidth();
    }
  }).promise().done(function () {
    $('.button-holder').map(function () {
      var currentStyle = $(this).attr('style');
      if (currentStyle != '') currentStyle += ';';
      currentStyle += 'width: ' + maxWidth + 'px !important';
      $(this).attr('style', currentStyle);
    });
  });
}

function handleDefault(thisObj) {
  if ($('.tab-product').is(':visible')) {
    store.current_product_tab = 'product';
    toggleTab('product');
  } else if ($('.tab-search').is(':visible')) {
    renderSearch();
  }
}

function handleSearch(param) {
  var key = event.keyCode || event.which;
  if (param && param === true) {
    key = 13;
  }
  if (key == 13) {
    store.current_product_tab = 'search';
    renderSearch();
  }
  refreshPage();
}

function renderSearch() {
  var productDataList = [];
  var searchStr = $('#search-input').val();
  var testPatton = new RegExp(searchStr, "i");
  for (var key in productFullData) {
    if (testPatton.test(productFullData[key]['nm'])) {
      productDataList.push(productFullData[key]);
    }
  }
  productFilterData = productDataList;
  if (searchStr == '') {
    $('#search-result-header').hide();
  } else {
    $('#search-result-text').html('「' + searchStr + '」');
    $('#search-result-header').show();
  }
  generateProductFilterData('search');
  sortData();
  createProductList(productFilterData);
  toggleTab('search');
}

function handleVolume(thisObj) {
  if (thisObj.is('.active')) {
    return;
  } else {
    $('.sorting').removeClass('active');
    $('.sorting .icon').removeClass('up').addClass('down');
    thisObj.addClass('active');
    //filter the data
    generateProductFilterData();
    productFilterData = sortData('volume');
    createProductList(productFilterData);
  }
  refreshPage();
}

function handlePrice(thisObj) {
  if (thisObj.is('.active')) {
    if (thisObj.find('.icon').is('.up')) {
      thisObj.find('.icon').removeClass('up').addClass('down');
      store.filter_price_order = 'DESC';
    } else {
      thisObj.find('.icon').removeClass('down').addClass('up');
      store.filter_price_order = 'ASC';
    }
  } else {
    store.filter_price_order = 'DESC';
    $('.sorting').removeClass('active');
    thisObj.find('.icon').removeClass('up').addClass('down');
  }

  thisObj.addClass('active');

  //filter the data
  generateProductFilterData();
  if (store.filter_price_order == 'ASC') {
    sortData('price_asc');
  } else {
    sortData('price_desc');
  }
  createProductList(productFilterData);
  refreshPage();
}

function handleFilter(thisObj) {
  $('#store-filter-modal').modal({
    closable: false,
    selector: {
      close: '.cu-modal-close-icon',
    },
    onVisible: function () {
      //set menu and catageries
      if (store.filter_current_menu) {
        $('.filter-menu-item[data-value=' + store.filter_current_menu + ']').trigger('click');
      }
      $('.cat-menu:visible .list .child.checkbox').checkbox('uncheck');
      $.each(store.filter_current_cats, function (index, value) {
        $('.cat-menu:visible input[tabindex="' + value + '"]').parent().checkbox('check');
      });

      //preset menu if only 1 menu
      if ($('.filter-menu-item').length == 1) {
        $('.filter-menu-dropdown').find('.dropdown.cu-input').dropdown('set selected', $($('.filter-menu-item')[0]).attr('data-value'));
        $('.filter-menu-dropdown').css('margin', 0);
        $('.filter-menu-dropdown').find('.dropdown.cu-input').hide();
      }

      //create range slider
      $('#filter-price-slider').slider({
        range: true,

        min: 0,
        max: store.filter_price_max,
        values: [store.filter_price_min, store.filter_price_max],
        orientation: "horizontal",
        slide: function (ev, ui) {

          $('#filter-price-min').val(ui.values[0]);
          $('#filter-price-max').val(ui.values[1]);
        }
      });

      //set price range
      $('#filter-price-min').val(store.filter_price_min);
      $('#filter-price-max').val(store.filter_price_max);

      //set group by categories
      if (store.filter_group_by_categories) {
        $('#group-by-categories').parent().checkbox('check');
      } else {
        $('#group-by-categories').parent().checkbox('uncheck');
      }

      //set normal product setting
      if (store.filter_show_coupon) {
        $('#filter-show-coupon').parent().checkbox('check');
      } else {
        $('#filter-show-coupon').parent().checkbox('uncheck');
      }
      if (store.filter_show_selfinput) {
        $('#filter-show-selfinput').parent().checkbox('check');
      } else {
        $('#filter-show-selfinput').parent().checkbox('uncheck');
      }
      if (store.filter_show_callvendor) {
        $('#filter-show-callvendor').parent().checkbox('check');
      } else {
        $('#filter-show-callvendor').parent().checkbox('uncheck');
      }

      $('.ui.accordion')
        .accordion({
          exclusive: false,
        });
    },
    onApprove: function () {
      if (!validateFilter()) {
        return false;
      }
      //get catageries
      store.filter_current_cats = [];
      if ($('.filter-menu-dropdown .cu-input.dropdown').length != 0) {
        $('.cat-menu.is-active .child.checkbox').find('input:checked').each(function () {
          store.filter_current_cats.push(parseInt($(this).attr('tabindex')));
        });
      } else {
        $('.cat-menu .child.checkbox').find('input:checked').each(function () {
          store.filter_current_cats.push(parseInt($(this).attr('tabindex')));
        });
      }

      //get price range
      if (!$.isEmptyObject($('#filter-price-min').val())) {
        store.filter_price_min = round($('#filter-price-min').val(), 2);
      }
      if (!$.isEmptyObject($('#filter-price-max').val())) {
        store.filter_price_max = round($('#filter-price-max').val(), 2);
      }

      //get menu
      store.filter_current_menu = parseInt($('#select-menu').val());

      //get group by categories
      store.filter_group_by_categories = $('#group-by-categories').is(':checked');

      //get normal product setting
      store.filter_show_coupon = $('#filter-show-coupon').is(':checked');
      store.filter_show_selfinput = $('#filter-show-selfinput').is(':checked');
      store.filter_show_callvendor = $('#filter-show-callvendor').is(':checked');

      //refresh product
      toggleTab('product');
    }
  }).modal('show');
}

//  sort data
function sortData(type) {
  productFilterData = productFilterData.sort(function (pData1, pData2) {
    if (sortingCompare(pData1)) {
      return -1;
    } else if (sortingCompare(pData2)) {
      return 1;
    }
    if (type) {
      if (type == 'volume') {
        return pData2['scnt'] - pData1['scnt'];
      } else if (type == 'price_asc') {
        return pData1['pc'] - pData2['pc'];
      } else if (type == 'price_desc') {
        return pData2['pc'] - pData1['pc'];
      }
    }
  });

  return productFilterData;
}

/**
 * [sortingCompare description]
 * @param  {[type]} pData [description]
 * @return {[type]}       [return true if the coupon/selfinput/callvendor flag is on and current product is coupon/selfinput/callvendor]
 */
function sortingCompare(pData) {
  var compareFlag = false;
  if (pData['pt'] == 2) {
    compareFlag = true;
  } else if (pData['pt'] == 3) {
    compareFlag = true;
  } else if (pData['pt'] == 4) {
    compareFlag = true;
  }

  return compareFlag;
}

function generateProductFilterData(type) {
  if (type && type != 'search') {
    productFilterData = $.extend(true, [], productFullIndexData);
  }
  for (var i = 0; i < productFilterData.length; i++) {
    //filter catid
    if (productFilterData[i]['ctids']) {
      for (var j = 0; j < productFilterData[i]['ctids'].length; j++) {
        productFilterData[i]['ctids'][j] = parseInt(productFilterData[i]['ctids'][j]);
      }
      if (store.filter_current_cats && $.tools.arrayDiff(productFilterData[i]['ctids'], store.filter_current_cats).length == 0) {
        productFilterData.splice(i, 1);
        i--;
        continue;
      }
    }

    if ([2, 3, 4].indexOf(productFilterData[i]['pt']) != -1) {
      //filter coupon
      if (!store.filter_show_coupon && productFilterData[i]['pt'] == 4) {
        productFilterData.splice(i, 1);
        i--;
        continue;
      }

      //filter selfinput
      if (!store.filter_show_selfinput && productFilterData[i]['pt'] == 2) {
        productFilterData.splice(i, 1);
        i--;
        continue;
      }

      //filter call vendor
      if (!store.filter_show_callvendor && productFilterData[i]['pt'] == 3) {
        productFilterData.splice(i, 1);
        i--;
        continue;
      }
    } else {
      //filter price
      if (store.filter_price_min && productFilterData[i]['pc'] < store.filter_price_min) {
        productFilterData.splice(i, 1);
        i--;
        continue;
      } else if (store.filter_price_max && productFilterData[i]['pc'] > store.filter_price_max) {
        productFilterData.splice(i, 1);
        i--;
        continue;
      }
    }
  }

  return productFilterData;
}

function getDefaultMenuAndCats() {
  if (store.menus) {
    //store.filter_current_cats = [8933, 9206, 9207];
    var orderMenu = [101, 102, 103, 104];
    var tempFinalMenu;
    var tempCompareArray = $.tools.arrayDiff(orderMenu, Object.keys(store.menus).map(Number));
    var currentTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    if (tempCompareArray.length != 0) {
      var tempCompareTimeDiff = 86400;
      //start get default
      if (tempCompareArray.indexOf(104) != -1) {
        if (compareTime('16:00', currentTime) < tempCompareTimeDiff || compareTime('23:00', currentTime) < tempCompareTimeDiff) {
          tempFinalMenu = 104;
          tempCompareTimeDiff = (compareTime('16:00', currentTime) < compareTime('23:00', currentTime)) ?
            compareTime('16:00', currentTime) : compareTime('23:00', currentTime);
        }
      }

      if (tempCompareArray.indexOf(103) != -1) {
        if (compareTime('10:00', currentTime) < tempCompareTimeDiff || compareTime('15:00', currentTime) < tempCompareTimeDiff) {
          tempFinalMenu = 103;
          tempCompareTimeDiff = (compareTime('10:00', currentTime) < compareTime('15:00', currentTime)) ?
            compareTime('10:00', currentTime) : compareTime('15:00', currentTime);
        }
      }

      if (tempCompareArray.indexOf(102) != -1) {
        if (compareTime('10:00', currentTime) < tempCompareTimeDiff || compareTime('14:00', currentTime) < tempCompareTimeDiff) {
          tempFinalMenu = 102;
          tempCompareTimeDiff = (compareTime('10:00', currentTime) < compareTime('14:00', currentTime)) ?
            compareTime('10:00', currentTime) : compareTime('14:00', currentTime);
        }
      }

      if (tempCompareArray.indexOf(101) != -1) {
        if (compareTime('5:00', currentTime) < tempCompareTimeDiff || compareTime('11:00', currentTime) < tempCompareTimeDiff) {
          tempFinalMenu = 101;
          tempCompareTimeDiff = (compareTime('5:00', currentTime) < compareTime('11:00', currentTime)) ?
            compareTime('5:00', currentTime) : compareTime('11:00', currentTime);
        }
      }

      store.filter_current_menu = tempFinalMenu;
      store.filter_current_cats = store.menus[tempFinalMenu];

    } else {
      //select the first menu excpet the orderMenu
      store.filter_current_menu = Object.keys(store.menus)[0];
      store.filter_current_cats = store.menus[Object.keys(store.menus)[0]];
    }
  }
  return;
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
    'background-image': 'url(' + CLOUDINARY + 'image/upload/v1480380858/admin/i_plus.png)',
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
      complete: function () {
        flyer.remove();
      }
    });
}

function share(thisObj) {
  $('#hide-google-iframe').remove();
  var params = {};
  var type = thisObj.attr('share');

  if ($('.main-modal:visible').length == 0) {
    params.img = store.img;
    params.title = store.nm;
    params.desc = store.desc;

    var urlParams = $.tools.getUrlParameters();
    params.url = location.origin + location.pathname;
  } else {
    params.img = productFullData[modalId]['iurl'];
    params.title = productFullData[modalId]['nm'];
    params.desc = $('.main-modal:visible').find('.modal-desc').html();
    params.storeTitle = store.nm;

    urlParams = $.tools.getUrlParameters();
    params.url = location.origin + `/product/${modalId}`;
  }

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

function addProductHistory(pid) {
  addFootprint({
    's_id': groupId,
    's_nm': store.nm,
    's_addr': store.s_addr,
    's_phone': store.phone,
    's_img': CLOUDINARY + 'f_auto,fl_lossy,q_auto/' + store.img,
    's_rating': store.s_rating,
    's_cid': categoryId,
    'p_info': {
      'p_id': pid,
      'p_nm': productFullData[pid]['nm'],
      'p_rating': productFullData[pid]['rat'],
      'p_img': CLOUDINARY + 'f_auto,fl_lossy,q_auto/' + productFullData[pid]['iurl'],
    }
  }).done(function (res) {
    console.log(res);
  });

  //initialize google share
  initGoogleShare(pid);
}

function initGoogleShare(pid) {
  var googleShareBtnId = '';
  var pData = productFullData[pid];
  if (pData['pt'] == 1) {
    googleShareBtnId = 'sharegg-noopt';
  } else if (pData['pt'] == 2) {
    googleShareBtnId = 'sharegg-self';
  }
  // else if (pData['pt'] == 3) {
  //
  // }
  else if (pData['pt'] == 4) {
    googleShareBtnId = 'sharegg-coupon';
  } else if (!$.isEmptyObject(pData['opt'])) {
    googleShareBtnId = 'sharegg-opt';
  } else {
    googleShareBtnId = 'sharegg-noopt';
  }


  GGObjProduct.contenturl = 'https://shop.goopter.com/store/preview.php?param=' + pData['iurl'];
  GGObjProduct.calltoactionurl = 'https://shop.goopter.com/product/' + pid;
  GGObjProduct.prefilltext = pData['nm'] + ' (' + GGObjProduct.calltoactionurl + ')';
  if (googleShareBtnId != '') {
    shareGg(googleShareBtnId, GGObjProduct);
  }
}

function pointsInfo() {
  var info = trans['alert_reward_points'];
  toast({
    text: info,
    style: 'weixin__text',
    duration: 4000
  });
}

function refreshCaptcha() {
  $('.captcha-image-container .captcha-image').hide();
  $('.captcha-image-container .loader').show();
  var data = {
    type: "POST",
    action: "get_captcha"
  }
  $.ajax({
    url: "/oauth/",
    type: "POST",
    data: data,
    headers: {
      "Authorization": "Basic " + btoa("user:pw")
    },
    xhrFields: {
      withCredentials: true
    },
    mimeType: "text/plain; charset=x-user-defined",
    error: function () { }
  }).done(function (data) {
    $('.captcha-image').attr('src', 'data:image/jpeg;base64,' + $.tools.base64Encode(data));
    $('.captcha-image-container .captcha-image').show();
    $('.captcha-image-container .loader').hide();
  });
}

// Back to top function
$(window).scroll(function () {
  if ($(this).scrollTop() > 50) {
    $('#back-to-top').fadeIn();
  } else {
    $('#back-to-top').fadeOut();
  }

  //cat-buttons scroll spy START
  // Get container scroll fromTop
  var fromTop = $(this).scrollTop() + 50;
  if (typeof $data['$topMenu'] == 'undefined') {
    return false;
  } else if ($data['$topMenu'].is('.fixed')) {
    fromTop = fromTop + (($(window).width() >= 1440) ? 0 : $data['topMenuOuterHeight']);
  } else {
    fromTop = fromTop + (($(window).width() >= 1440) ? $data['topMenuOuterHeightWithMargin'] : $data['topMenuOuterHeightWithMargin'] + $data['topMenuOuterHeight']);
  }

  // Get id of current scroll item
  var cur = $scrollItems.map(function () {
    if ($(this).offset().top < fromTop)
      return $(this);
  });
  // Get the id of the current element
  cur = cur[cur.length - 1];
  var id = cur && cur.length ? cur[0].id : $scrollItems[0].id;

  if ($data['lastId'] !== id) {
    $data['lastId'] = id;
    // Set/remove active class
    $data['$menuItems']
      .parent().removeClass("active")
      .end().filter('[href="#' + id + '"]').parent().addClass("active");
  }
  //cat-buttons scroll spy END
});

$(document).ready(function () {

  $('.tab-review').on('click', '.rwlst-paging', function () {
    reviewPage = $(this).attr("page");
    $('.rwlst-paging').removeClass("active");
    $('.rwlst-paging').prop("disabled", false);
    $(this).addClass("active");
    $(this).removeClass("hidden-paging");
    showPageWithinRange(reviewPage);


    loadReview(reviewPage);
    $(this).prop("disabled", true);

    $('.rwlst-next').removeClass("disabled");
    $('.rwlst-next').prop("disabled", false);
    $('.rwlst-previous').removeClass("disabled");
    $('.rwlst-previous').prop("disabled", false);

    if (reviewPage == 1) {
      $('.rwlst-previous').addClass("disabled");
      $('.rwlst-previous').prop("disabled", true);
    }
    if (reviewPage == total_review_pages) {
      $('.rwlst-next').addClass("disabled");
      $('.rwlst-next').prop("disabled", true);
    }
  });

  $('.tab-review').on('click', '.rwlst-previous', function () {
    reviewPage--;
    $('[page="' + reviewPage + '"].rwlst-paging').click();
  });

  $('.tab-review').on('click', '.rwlst-next', function () {
    reviewPage++;
    $('[page="' + reviewPage + '"].rwlst-paging').click();
  });
  //hehe


  $('.phone-formater').html($.tools.phoneFormater($('.phone-value').text()));
  localStorage.removeItem('storelogin');
  //initialize store filter setting
  store.filter_show_coupon = true;
  store.filter_show_selfinput = true;
  store.filter_show_callvendor = true;
  store.filter_price_min = 0;
  store.filter_price_max = 0;
  store.filter_group_by_categories = true;
  store.product_list_style = 'gird';

  //store.menus
  store.current_product_tab = 'product';

  //set default cat
  getDefaultMenuAndCats();

  //create and refresh product data list
  createProductDataList().then(function (productDataList) {
    //local time to utc
    var currentTime = new Date().getTime();
    for (var i = 0; i < productDataList.length; i++) {

      /* check spacial price status
       * if the product special price is valid, add to pc field, and original pc field to old_price
       */
      if (productDataList[i]['spc']) {
        var startTime = Date.parse(productDataList[i]['sdt']);
        var endTime = Date.parse(productDataList[i]['edt']);
        if (currentTime >= startTime && currentTime <= endTime) {
          productDataList[i]['old_price'] = productDataList[i]['pc'];
          productDataList[i]['pc'] = productDataList[i]['spc'];
        }
      }

      productFullData[productDataList[i]['pid']] = productDataList[i];
      var pData = productFullData[productDataList[i]['pid']];
      if ($.isArray(pData['opt'])) {
        var newOpt = {};
        var k, optData;
        for (k = 0; k < pData['opt'].length; k++) {
          optData = pData['opt'][k];
          if (optData['min'] == undefined) {
            optData['min'] = 0;
          }
          if (optData['max'] == undefined) {
            optData['max'] = 1;
          }
          newOpt[optData['id']] = $.extend(true, {}, optData);
          newOpt[optData['id']]['opts'] = {};
          var j;
          for (j = 0; j < optData['opts'].length; j++) {
            newOpt[optData['id']]['opts'][optData['opts'][j]['id']] = optData['opts'][j];
          }
        }
        pData['opt'] = newOpt;
      }
      store.filter_price_max = (store.filter_price_max > pData['pc']) ? store.filter_price_max : pData['pc'];
    }
    productFullIndexData = productDataList;
    productFilterData = $.extend(true, [], productFullIndexData);
    generateProductFilterData();
    createProductList(productFilterData);

    // scroll to category
    if ($get.cids) {
      var firstCid = $get.cids.split(',')[0];
      $(`#cat-${firstCid}-button`).trigger('click');
    }
  });

  refreshBookmark();

  //add store history
  addFootprint({
    's_id': groupId,
    's_nm': store.nm,
    's_addr': store.s_addr,
    's_phone': store.phone,
    's_img': CLOUDINARY + 'f_auto,fl_lossy,q_auto/' + store.img,
    's_rating': store.s_rating,
  }).done(function (res) {
    console.log(res);
  });

  // create store image gallery
  createStoreInfoGallery();

  // event listeners
  $('body').on('login-modal-show', function () {
    localStorage.setItem('storelogin', groupId);
  });

  $('.btn-share').on('click', function () {
    share($(this));
  });

  $('.main-modal').on('click', 'a', function () {
    $(this).attr('target', '_blank');
  })

  $('#select-menu').on('change', function (event) {
    $('.cat-menu').hide().removeClass('is-active');
    $('.cat-menu-' + $(this).val()).show().addClass('is-active');
    $('.cat-menu-all-' + $(this).val()).show();
  });

  /*
    .button-holder, modal listener is in store.common.js
   */

  $('.tab-toggle').on('click', '.btn-open-option-picker', function () {
    openOptionPicker($(this).attr('pid'));
    reloadOptionPicker($(this).attr('pid'));
    addProductHistory($(this).attr('pid'));
  });

  $('#btn-modal-add-option-initial').on('click', function () {
    openOptionPicker(modalId);
    reloadOptionPicker(modalId);
    addProductHistory(modalId);
  });

  $('#btn-modal-add-option').on('click', function () {
    openOptionPicker(modalId);
    reloadOptionPicker(modalId);
    addProductHistory(modalId);
  });

  $('.tab-toggle').on('click', '.btn-add-no-option', function () {
    if (addNoOption($(this).attr('pid'))) {
      flyToCart($(this));
    }
  });

  $('.tab-toggle').on('click', '.btn-remove-no-option', function () {
    removeNoOption($(this).attr('pid'));
  });

  $('.tab-toggle').on('click', '.btn-remove-with-option', function () {
    removeWithOptionButtonClick($(this).attr('pid'));
  });

  $('#modal-option-button-wrap').on('click', '#btn-modal-remove-option', function () {
    removeWithOptionButtonClick($(this).attr('pid'));
  });

  $('#btn-modal-add-no-option-initial').on('click', function () {
    if (addNoOption(modalId)) {
      flyToCart($('#btn-modal-add-no-option'));
    }
  });

  $('#btn-modal-add-no-option').on('click', function () {
    if (addNoOption(modalId)) {
      flyToCart($(this));
    }
  });

  $('#btn-modal-remove-no-option').on('click', function () {
    removeNoOption(modalId);
  });

  $('#option-list').on('click', '.btn-option-selector', function () {
    var parentId = $(this).parent().parent().attr('optid');
    var optionId = $(this).attr('optid');
    var opt = productFullData[modalPickerId]['opt'][parentId];
    var optData = opt['opts'][optionId];
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
    pickerCount = checkOptionItemCount();
    refreshPickerModal();
    $('#option-price-picked').html('<span class="price-unit">$</span><span class="price">' + round(pickerPrice, 2) + '</span>');
  });

  $('#cart-list').on('click', '.btn-cart-minus', function () {
    removeFromCartBtn($(this).attr('index'));
    return false;
  });

  $('#cart-list').on('click', '.btn-cart-plus', function () {
    addFromCartBtn($(this).attr('index'));
    return false;
  });

  $('.shop-cartfooter').on('click', '.shop-clickable', function () {
    $('.shop-cart').toggleClass('open');
    if ($('.shop-cart').hasClass('open')) {
      $('.shop-cart').css('bottom', '3.3rem')
    } else {
      $('.shop-cart').css('bottom', `calc(-${$('.shop-cartcontainer').height()}px + 3.3rem)`)
    }
  });

  $('#switcher').on('click', ' a.item', function () {
    $('#switcher a.item').removeClass('active');
    $(this).addClass('active');
  });

  //image carousel for product modal
  $('.main-modal').on('click', '.modal-img-carousel-item', function () {
    $('.modal-img-carousel-item').removeClass('active');
    $(this).addClass('active');
    $('.modal-img-content').hide();
    $('.modal-img-content[image-id="' + $(this).attr('image-id') + '"]').show();
  });

  $('.modal-img').on('mouseenter', '.image-zoom-container', function () {
    $(this).closest('.modal-img-content').imageZoom({
      imageContainerClass: 'image-zoom-container',
      width: 495,
      height: 495
    });
  });

  //infinate scroll review
  $('#comment-list')
    .visibility({
      once: false,
      // update size when new content loads
      observeChanges: true,
      // load content on bottom edge visible
      onBottomVisible: function () {
        // bottom is visiable
        if (!firstReview) {
          loadReview();
        }
      }
    });

  $('.comment-pagination').on('click', '.product-pagination', function () {
    if ($(this).is('.disabled')) {
      return;
    }
    loadProductReview($(this).attr('pid'), $(this).attr('data-page'), $(this).attr('data-comment-selector'));
  });


  //put into common.js
  $('.main-modal, .tab-store, #store-tab').on('click', '.write-review', function () {
    //hehe
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
          img_count = 0;
          $('.img_upload_area').html(`<div img-type="logo" class="blueimp-links" hidden="" style="display: flex;">
         </div>`);

          let currentType = $('.blueimp-links').attr('img-type');
 
          $('.blueimp-links').map(function () {
          
            $(this).loadImagePlugin({
              type: {
                type: 'store',
                imageType: currentType,
              },
              imageOptions: {
                multiUpload: !(currentType == 'logo' || currentType == 'header'),
                maxWidth: (currentType === 'header') ? 1920 : undefined,
                maxHeight: (currentType === 'header') ? 190 : undefined,
              }
            });
      
          });

         
          // $(this).loadImagePlugin({
          //   imageList:[],
          //   type: {
          //     type: 'store',
          //     imageType: currentType,
          //   },
          //   imageOptions: {
          //     multiUpload: !(currentType == 'logo' || currentType == 'header'),
          //     maxWidth: (currentType === 'header') ? 1920 : undefined,
          //     maxHeight: (currentType === 'header') ? 190 : undefined,
          //   }
          // });

          // console.log($('.blueimp-links').data());
          // $(`.blueimp-links`).data().loadImagePlugin.enableEdit();

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
        onApprove: function () {
          if (thisObj.attr('data-action') == 'post_store_review') {
            postReview({
              "action": thisObj.attr('data-action'),
              "id": thisObj.attr('data-id'),
              // "name": store.nickname,
              "store_rating": $('#modal-post-review .ui.rating.store_rat').rating('get rating'),
              "general_comment": $('#modal-post-review .review_txt').val(),
              // "content": $('#modal-post-review .review_service_txt').val(),
              "imgs": [],
            }, 1).done(function (res) {
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
              if (!firstReview) {
                $('#comment-list').html('');
                reviewPage = 0;
                loadReview();
              }

            });
          }
          else {
            postReview({
              "action": thisObj.attr('data-action'),
              "pid": thisObj.attr('data-id'),
              "id": groupId,
              // "name": store.nickname,
              "product_rating": $('#modal-post-review .ui.rating.store_rat').rating('get rating'),
              "comment": $('#modal-post-review .review_txt').val(),
              // "content": $('#modal-post-review .review_service_txt').val(),
              "imgs": [],
            }, 2).done(function (res) {
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
              modalId = '';
              productCommentCache = {};
            });
          }
	 uploadImage();
        },
        onHide: function(){
          $('.blueimp-links').data().loadImagePlugin.clearAllImage();
        }
      })
        .modal('show');
    } else {
      toast({
        text: trans['review_need_signin'],
        style: 'weixin__text',
      });
    }
  });

  $('#modal-post-review').on('keyup', 'textarea', function () {
    if ($(this).val() != '' && $('#modal-post-review .ui.rating').rating('get rating') != 0) {
      $('#modal-post-review .post-button').removeClass('disabled');
    } else {
      $('#modal-post-review .post-button').addClass('disabled');
    }
  });

  //hehe


  //hehe uploadimg
  // $("#modal-post-review").on('change', '.upload_img', function () {
  //   readURL(this);
  // });

  //initial modal
  $('.ui.modal')
    .modal({
      duration: 200,
      selector: {
        close: '.remove.icon',
      }
    });

  $('.main-modal')
    .modal({
      duration: 200,
      observeChanges: false,
      selector: {
        close: '.remove.icon',
      },
      onHidden: function () {
        var tempDom = $(this).find('.modal-desc').html();
        $(this).find('.modal-desc').html('').html(tempDom);
      }
    });

  //initial checkout
  $('.ui.checkbox')
    .checkbox();

  $('.list .master.checkbox')
    .checkbox({
      // check all children
      onChecked: function () {
        var
          $childCheckbox = $(this).closest('.checkbox').siblings('.list').find('.checkbox');
        $childCheckbox.checkbox('check');
      },
      // uncheck all children
      onUnchecked: function () {
        var
          $childCheckbox = $(this).closest('.checkbox').siblings('.list').find('.checkbox');
        $childCheckbox.checkbox('uncheck');
      }
    });

  $('.list .master.checkbox').closest('.checkbox').checkbox('check');

  $('.list .child.checkbox')
    .checkbox({
      // Fire on load to set parent value
      fireOnInit: true,
      // Change parent state on each child checkbox change
      onChange: function () {
        var
          $listGroup = $(this).closest('.list'),
          $parentCheckbox = $listGroup.closest('.item').children('.checkbox'),
          $checkbox = $listGroup.find('.checkbox'),
          allChecked = true,
          allUnchecked = true;
        // check to see if all other siblings are checked or unchecked
        $checkbox.each(function () {
          if ($(this).checkbox('is checked')) {
            allUnchecked = false;
          } else {
            allChecked = false;
          }
        });
        // set parent checkbox state, but dont trigger its onChange callback
        if (allChecked) {
          $parentCheckbox.checkbox('set checked');
        } else if (allUnchecked) {
          $parentCheckbox.checkbox('set unchecked');
        } else {
          $parentCheckbox.checkbox('set indeterminate');
        }
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

  // scroll body to 0px on click
  $('#back-to-top').click(function () {
    $('body,html').animate({
      scrollTop: 0
    }, 800);
    return false;
  });

  //for contact us form
  $('.tab-contact .ui.form')
    .form({
      fields: {
        name: {
          identifier: 'name',
          rules: [{
            type: 'empty'
          }]
        },
        email: {
          identifier: 'email',
          rules: [{
            type: 'empty'
          },
          {
            type: 'email'
          },
          ]
        },
        telephone: {
          identifier: 'telephone',
          rules: [{
            type: 'number'
          },
          {
            type: 'exactLength[10]'
          },
          ]
        },
        textarea: {
          identifier: 'comment',
          rules: [{
            type: 'empty'
          }]
        },
        captcha: {
          identifier: 'captcha',
          rules: [{
            type: 'number'
          },
          {
            type: 'exactLength[5]'
          },
          ]
        },
      },
      onSuccess: function (event, fields) {
        var postData = fields;
        postData['gid'] = groupId;
        if ($('#contact-us-with-time-checkbox').checkbox('is checked')) {
          postData['comment'] += '\n' + trans['contact_us_with_time'] + ': ' + $('#contact-us-time').val();
        }
        var data = {
          type: "POST",
          action: "contact_us",
          data: postData
        };
        $.ajax({
          url: "/oauth/",
          type: "POST",
          data: data,
          dataType: "json",
          error: function () { }
        }).done(function (data) {
          console.log(data);
          refreshCaptcha();
          $('.tab-contact .ui.form').form('set values', {
            name: "",
            email: "",
            telephone: "",
            comment: "",
            captcha: ""
          });
          $('#contact-us-with-time-checkbox').checkbox('uncheck');
          if (data['RC'] == 200) {
            alert(trans['alert_email_success']);
          } else {
            alert(trans['alert_email_failed']);
          }
        });
      },
    });

  //for contact us time
  $('#contact-us-with-time-checkbox').checkbox({
    onChecked: function () {
      $('#contact-us-time').datetimepicker({
        inline: true,
        weeks: true
      });
      $('.xdsoft_today_button').trigger('mousedown');
      var now = new Date();
      $('#contact-us-time').val(now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() + ' ' + now.getHours() + ":" + now.getMinutes());
    },
    onUnchecked: function () {
      $('#contact-us-time').datetimepicker('destroy');
    }
  });

  /*cat - buttons scroll spy START*/
  // Cache selectors
  $data['$topMenu'] = $('#cat-buttons'),
    $data['topMenuOuterHeight'] = $data['$topMenu'].outerHeight(),
    $data['topMenuOuterHeightWithMargin'] = $data['$topMenu'].outerHeight(true),
    // All list items
    $data['$menuItems'] = $data['$topMenu'].find(".menu-button"),
    // Anchors corresponding to menu items
    $scrollItems = $data['$menuItems'].map(function () {
      var item = $($(this).attr("href"));
      if (item.length) {
        return item[0];
      }
    });

  // Bind click handler to menu items
  $data['$topMenu'].on('click', '.cat-button', function (e) {
    var href = $(this).find('.menu-button').attr("href");
    var fromTop = 0;
    if ($scrollItems.filter(href).length > 0) {
      fromTop = $scrollItems.filter(href).prev().offset().top;
    }
    if ($data['$topMenu'].is('.fixed')) {
      fromTop = fromTop - (($(window).width() >= 1440) ? 0 : $data['topMenuOuterHeight']);
    } else {
      fromTop = fromTop - (($(window).width() >= 1440) ? $data['topMenuOuterHeightWithMargin'] : $data['topMenuOuterHeightWithMargin'] + $data['topMenuOuterHeight']);
    }
    $('html, body').stop().animate({
      scrollTop: fromTop
    }, 500, function () {
      $data['$menuItems'].parent().removeClass('active');
      $data['$menuItems'].filter('[href="' + href + '"]').parent().addClass('active');
    });
    e.preventDefault();
  });
  /*cat-buttons scroll spy END*/

});
