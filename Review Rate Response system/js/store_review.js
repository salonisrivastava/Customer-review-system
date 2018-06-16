//global variables
const itemsPerPage = 6;
var gid;
var needed_Review_List;
var to_display_ids;
var usingPages;
var displayed_ids;
var start_Date;
var end_Date;
var img_in_gallery;

function getReviewList(cb, flg) {
  var data = {
    type: "GET",
    action: "reply",
    data: ""
  };

  $.ajax({
    url: "/oauth/",
    type: "POST",
    data: data,
    dataType: "json",
    error: function () { }
  }).done(function (res) { cb(res, flg) });

}


function reviewAll(res, flag) {
  usingPages = 0;
  to_display_ids = {};
  displayed_ids = [];
  img_in_gallery = {};
  needed_Review_List = [];
  $('.feed-activity-list').html('');
  $('.feed-activity-list-not-replied').html('');
  $('.pagination-lg').html('');
  $('.pagination-lg-not-replied').html('');
  showStoreRate(res);
  pagination(res, flag);
  createPaginationBar(flag);
  displayReview(res);
  showPages('1');
}

function pagination(res, flag) {
  needed_Review_List = [];
  var count = 0;
  res['records'].forEach(function (review, i) {
    if (neededReview(review, flag)) {
      needed_Review_List.push(i);
      var customerId = review["cid"];
      var usingId = (review["oid"] == undefined) ? customerId : review["oid"];
      if (!to_display_ids.hasOwnProperty(usingId)) {
        count++;
        in_page = Math.ceil(count / itemsPerPage);
        to_display_ids[usingId] = in_page;
      }
    }
  })
  usingPages = Math.ceil(count / itemsPerPage);
  for (var i = 1; i <= usingPages; i++) {
    var html = `<div id='page_${i}'>`;
    if (flag != 1)
      $('.feed-activity-list').append(html);
    else
      $('.feed-activity-list-not-replied').append(html);
  }
}


function displayReview(res) {

  // var count = 0;
  // var count_Not_Replied = 0;
  // var count_Seven_Days=0;
  var in_page;

  // var now=moment();
  res['records'].forEach(function (review, i) {
    if (!needed_Review_List.includes(i))
      return;

    var customerId = review["cid"];
    var hasOrder;
    var approved;
    hasOrder = (review["oid"] == undefined) ? false : true;

    if(review['s_review']!==undefined){
      if(review['s_review']['general']!=undefined)
        approved = (review['s_review']['general']['approved']==1) ? true:false;    
    }
    
    var usingId = (review["oid"] == undefined) ? customerId : review["oid"];

    // var customerId = (review['is_anonymous'] == 0)? review["cid"]:"Anonymous User";

    var replyList = [];
    var productReplyList = [];
    findReply(review, replyList, productReplyList);

    var name = findName(review);
    var date = findDate(review);

    var rates = {};
    var serviceCommentList = [];

    //the svc, decr, deli rate only exists when the review comes with an order
    if(hasOrder)
      findRates(review['s_review'], rates);
    // if no order, then find the rate for general review
    if(!hasOrder)
      findGeneralRate(review['s_review'],rates);

    if (review['s_review'] != undefined) {
      findCostumerServiceComment(review['s_review'], serviceCommentList);
    }

    var productCommentList = [];
    if (review['p_review'] != undefined)
      findProductComment(review['p_review'], productCommentList);

    var imgList = [];

    if (review['p_review'] != undefined)
      findImgs(review['p_review'], imgList);

    in_page = to_display_ids[usingId];

    if (!displayed_ids.includes(usingId)) {
      displayed_ids.push(usingId);
      generateReviews(in_page, usingId, name, serviceCommentList, date, hasOrder,approved);
    }

    if (!jQuery.isEmptyObject(rates))
      generateRates(usingId, rates);

    if (serviceCommentList.length != 0)
      generateServiceComment(usingId, serviceCommentList);

    if (replyList.length != 0)
      generateReply(usingId, replyList);

    if (productCommentList.length != 0)
      generateProducts(usingId, productCommentList,hasOrder);

    if (productReplyList.length != 0)
      generateProductReply(usingId, productReplyList);

    if (imgList.length != 0)
      generateImgs(usingId, imgList);

  });
}


function neededReview(review, flag) {
  if (flag == 0)
    return true;
  else if (flag == 1) {
    var replyList = [];
    var productReplyList = [];
    findReply(review, replyList, productReplyList);
    if (replyList.length == 0 && productReplyList.length == 0) {
      return true;
    }
  }
  else if (flag == 2) {
    var now = moment();
    var date = findDate(review);
    var input = moment(date);
    if (now.isoWeek() == input.isoWeek())
      return true;
  }
  else if (flag == 3) {
    var now = moment();
    var date = findDate(review);
    var input = moment(date);
    if (now.month() == input.month())
      return true;
  }
  else if (flag == 4) {
    var begin = moment(start_Date);
    var end = moment(end_Date);
    var date = findDate(review);
    if (moment(date).isBetween(begin, end)) {
      return true;
    }
  }
  else if (flag == 5) {
    var rate = findLowestRate(review);
    if (rate < 3.5)
      return true;
  }
  else if (flag == 6) {
    var rate = findLowestRate(review);
    if (rate >= 3.5 && rate <= 5)
      return true;
  }
  else if (flag == 7) {
    if (review['oid']!==undefined)
      return true;
  }
  else{
    if (review['oid']==undefined)
      return true;
  }
  return false;
}

function showDateTimePicker() {

  // var html=`
  // <input class="form-control" type="text" name="daterange" value="05/01/2018 - 05/31/2018" />
  // `

  // $('.customtime').append(html);
  $('input[name="daterange"]').daterangepicker();

  $('.applyBtn').on('click',function(){
    setDateTimeFilter();
  })

  
  // $('#datetimepicker_start').datetimepicker({ format: 'YYYY-MM-DD', });
  // $('#datetimepicker_end').datetimepicker({
  //   format: 'YYYY-MM-DD',
  //   useCurrent: false 
  // });
  // $("#datetimepicker_start").on("dp.change", function (e) {
  //   $('#datetimepicker_end').data("DateTimePicker").minDate(e.date);
  // });
  // $("#datetimepicker_end").on("dp.change", function (e) {
  //   $('#datetimepicker_start').data("DateTimePicker").maxDate(e.date);
  // });

}

function setDateTimeFilter() {
  start_Date = $("input[name='daterangepicker_start']").val();
  end_Date = $("input[name='daterangepicker_end']").val();
  start_Date = start_Date.replace(/(\d\d)\/(\d\d)\/(\d{4})/, "$3-$1-$2");
  end_Date = end_Date.replace(/(\d\d)\/(\d\d)\/(\d{4})/, "$3-$1-$2");

  if (validDate(start_Date, end_Date)) {
    getReviewList(reviewAll, 4);
  }
}

function validDate(start, end) {
  if (start == "" || end == "") {
    swal({
      title: i18n.t('store_review.empty_date'),
      type: "warning",
      confirmButtonText: i18n.t('common.ok')
    });
    return false;
  }
  else if (moment(start).isAfter(moment())) {
    swal({
      title: i18n.t('store_review.invalid_date'),
      type: "warning",
      confirmButtonText: i18n.t('common.ok')
    });
    return false;
  }
  else {
    return true;
  }
  return true;
}

function countingStars(n){
  var html='';
  for(var i=1;i<=n;i++){
    html+='<i class="fa fa-star" aria-hidden="true"></i>';
  }
  if(!Number.isInteger(n))
    html+='<i class="fa fa-star-half" aria-hidden="true"></i>';
  return html;
}

function showStoreRate(res) {
  var overallRate = calculateAvgRate(res);

  $('#overall_rate').html(`
  <div style="display:flex">
  <div id="OverAllRate">${overallRate}</div> 

  <div class="review_summary" style="margin-left:30px">
  <div class="bar-rating">`+ countingStars(overallRate) + `</div>
  <span class="i18n text_content" data-i18n="store_review.reviews_in_all"> ${i18n.t('store_review.reviews_in_all')}</span> <span class="total_reviews text_content" style="margin-left:2px"></span>
  <span class="i18n text_content" data-i18n="store_review.reviews"> ${i18n.t('store_review.reviews').toLowerCase()}</span>
  </div>
  </div>
  `);


  // $('.bar-rating').map(function () {
  //   $(this).barrating({
  //     theme: 'css-stars',
  //     initialRating: $(this).attr('data-rating'),
  //     readonly: true,
  //   });
  // });
  $('.total_reviews').append(res['records'].length);
  var count = 0;
  var positive_count = 0;
  res['records'].forEach(function (review) {
    var rate = findLowestRate(review);
    if (rate < 9) {
      if (rate >= 3.5 && rate <= 5)
        positive_count++;
      count++;
    }
  })
  var positive_ratio = positive_count / count;
  positive_ratio = Math.round(positive_ratio * 1000) / 10 + "%";
  $('.progress-bar').attr('style', 'width: ' + positive_ratio);
  $('.positive_ratio').html('');
  $(".positive_ratio").append(positive_ratio);
  $(".positive_number").html('');
  $(".positive_number").append(positive_count);
  $(".negative_number").html('');
  $(".negative_number").append(count - positive_count);
  $('.no_rate_number').html('');
  $('.no_rate_number').append(res['records'].length - count);
}

function calculateAvgRate(res) {
  var product = [];
  var storeService = [];
  var storeDescription = [];
  var storeDelivery = [];
  res['records'].forEach(function (review) {
    if (review['p_review'] != undefined) {
      review['p_review'].forEach(function (rat) {
        if (rat['rat'] != undefined)
          product.push(rat['rat']);
      });
    }
    if (review['s_review'] != undefined) {
      var s_review = review['s_review'];
      if (s_review['service'] != undefined) {
        if (s_review['service']['rat'] != undefined)
          storeService.push(s_review['service']['rat']);
      }
      if (s_review['description'] != undefined) {
        if (s_review['description']['rat'] != undefined)
          storeDescription.push(s_review['description']['rat']);
      }
      if (s_review['delivery'] != undefined) {
        if (s_review['delivery']['rat'] != undefined)
          storeDelivery.push(s_review['delivery']['rat']);
      }
    }
  });

  var RateSum = function (rate) {
    var sum = (rate.length != 0) ? (rate.reduce(function (acc, val) { return acc + val; })) : 0;
    return sum;
  }
  var productRateSum = RateSum(product);
  var storeServiceSum = RateSum(storeService);
  var storeDescriptionSum = RateSum(storeDescription);
  var storeDeliverySum = RateSum(storeDelivery);
  var overallRate = (productRateSum + storeServiceSum + storeDescriptionSum + storeDeliverySum) /
    (product.length + storeService.length + storeDescription.length + storeDelivery.length);
  overallRate = Math.round(overallRate * 10) / 10;

  return overallRate;

}

function findGeneralRate(s_review,rates){
  if(s_review['general']!=undefined){
    rates['store_general'] = s_review['general']['rat'];
  }
}

function findRates(s_review, rates) {
  for (var s in s_review) {
    if (s == "service" || s == "description" || s == "delivery") {
      var s_review_prop = s_review[s];
      for (var ss in s_review_prop) {
        if (ss == "rat") {
          var rat = s_review_prop[ss];
          // var satisfied;
          if (rat != "")
            rates[s] = rat;
          //   satisfied = (rat == 5) ? 'very_satisfied' : (rat > 3.5) ? 'satisfied' : 'un_satisfied';
          // else
          //   satisfied = 'no rate';
          // rates[s] = satisfied;
        }
      }
    }
  }
}

function findLowestRate(review) {
  var lowRate = 10;
  if (review['s_review'] != undefined) {
    var s_review = review['s_review'];
    for (var s in s_review) {
      if (s == "service" || s == "description" || s == "delivery") {
        var s_review_prop = s_review[s];
        for (var ss in s_review_prop) {
          if (ss == "rat") {
            var temp_rat = s_review_prop[ss];
            if (temp_rat < lowRate)
              lowRate = temp_rat;
          }
        }
      }
    }
  }
  if (review['p_review'] != undefined) {
    var p_review = review['p_review'];
    for (var i = 0; i < p_review.length; i++) {
      if (p_review[i]['rat'] != undefined) {
        var temp_rat = p_review[i]['rat'];
        if (temp_rat < lowRate)
          lowRate = temp_rat;
      }
    }
  }
  return lowRate;
}

function findName(res) {
  var name = (res['c_name'] == undefined) ? "UnKnown" : res['c_name'];
  name = (res['is_anonymous'] == 1) ? "Anonymous" : name;
  return name;
}

function findCostumerServiceComment(s_review, commentList) {
  for (var s in s_review) {
    if (s == "service" || s == "description" || s == "delivery" || s == "general") {
      var s_review_prop = s_review[s];
      for (var ss in s_review_prop) {
        if (ss == "cmt")
          commentList.push(s_review_prop[ss]);
      }
    }
  }
}

function findProductComment(p_review, commentList) {
  for (var i = 0; i < p_review.length; i++) {
    var pid = p_review[i]['pid'];
    var nm = p_review[i]['name'];
    var approved =  p_review[i]['approved'];
    if (p_review[i]['cmt'] != undefined) {
      var cmt = p_review[i]['cmt'];
    }
    else {
      var cmt = "";
    }
    var product = { 'pid': pid, 'cmt': cmt, 'name': nm , 'approved':approved};
    commentList.push(product);
  }
}

function findReply(review, replyList, productReplyList) {
  if (review['p_review'] != undefined) {
    var p_review = review['p_review'];
    for (p of p_review) {
      var pid = p['pid'];
      if (p['reply'] != undefined) {
        var p_reply = p['reply'];
        if (p_reply['cmt'] != undefined)
          var cmt = p_reply['cmt'];
        var data = { 'pid': pid, 'cmt': cmt };
        productReplyList.push(data);
      }
    }
  }

  if (review['reply'] != undefined) {
    var r = review['reply'];
    if (r['cmt'] != undefined && r['cmt'] != "")
      replyList.push(r['cmt']);
  }
}

// function findComment(review, commentList) {
//   console.log(review);
//   if (review instanceof Object) {
//     for (var prop in review) {
//       if (prop == "cmt") {
//         commentList.push(review[prop]);
//       }
//       else {
//         if (review[prop] instanceof Object)
//           findComment(review[prop], commentList);
//       }
//     }
//   }
// }

function findDate(review) {
  var result = null;
  if (review instanceof Array) {
    for (var i = 0; i < review.length; i++) {
      result = findDate(review[i]);
      if (result) {
        break;
      }
    }
  }
  else {
    for (var prop in review) {
      if (prop == "upd_dt") {
        return (result = review[prop]);
      }
      if (review[prop] instanceof Object || review[prop] instanceof Array) {
        result = findDate(review[prop]);
        if (result) {
          break;
        }
      }
    }
  }
  return result;
}

function findImgs(products, imgList) {
  if (products instanceof Array) {
    for (var product of products) {
      for (var prop in product) {
        if (prop == "imgs") {
          var imgs = product[prop];
          for (var i = 0; i < imgs.length; i++)
            imgList.push(imgs[i]);
        }
      }
    }
  }
}

function generateServiceComment(cid, rList) {
  var reply = (rList.length == 0) ? "" : rList.reduce(function (a, b) { return a + ", " + b });
  if (rList.length != 0) {
    var html = `${reply}`;
    $('#' + cid + '.service_comment_area').attr("style", "display:block");
    $('#' + cid + '.service_comment_area').append(html);
  }
}

function generateRates(cid, rates) {
  $('#' + cid + '.rates_area').html('');
  
  for (var r in rates) {
    if (rates[r] != undefined) {
      var rate_stars = countingStars(rates[r]);
      var option = (r == "service") ? 'store_review.svc' : (r == "description") ? 'store_review.desc' : (r== "delivery")? 'store_review.delv': 'store_review.general';
      // var smile = (rates[r] == "very_satisfied") ? '<i class="fa fa-smile-o expression smile"></i>' : (rates[r] == "satisfied") ? '<i class="fa fa-comment"></i>' : (rates[r] == "un_satisfied")? '<i class="fa fa-comment"></i>':'';
      // var level = (rates[r] == "very_satisfied") ? "very" : (rates[r] == "satisfied") ? "normal" : (rates[r] == "un_satisfied")? "not":"un_rated";
      var html = '<small class="rate_type i18n" data-i18n=' + option + ' style="font-size:15px">' + i18n.t(option) + '</small>' 
      // + '<strong class="i18n rate_level ' + level + '" data-i18n="store_review.' + rates[r] + '">' + i18n.t('store_review.' + rates[r]) + '</strong>'
      //   + smile 
       + '<span class="rate_stars">'+ rate_stars + '</span>' +'\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0';
      $('#' + cid + '.rates_area').append(html);
    }
  }
}

function generateReply(cid, rList) {
  var reply = (rList.length == 0) ? "" : rList.reduce(function (a, b) { return a + ", " + b });
  if (rList.length != 0) {
    var html = `<span class="i18n" data-i18n="store_review.owner">${i18n.t("store_review.owner")}</span>:&nbsp&nbsp${reply}
    <a class="i18n delete_reply" onclick="deleteReply(${cid})" data-i18n="store_review.delete_reply">${i18n.t('store_review.delete_reply')}</a>
    `;
    if ($.trim($('#' + cid + '.show_reply_area').html())) {
      html = '\xa0\xa0\xa0' + reply;
    }
    $('#' + cid + '.show_reply_area').attr("style", "display:block");
    $('#' + cid + '.show_reply_area').append(html);
  }
}

function generateProductReply(cid, pList) {
  if (pList.length != 0) {
    for (var i = 0; i < pList.length; i++) {
      var p = pList[i];
      var pid = p['pid'];
      var cmt = p['cmt'];
      if (cmt != undefined && cmt != "") {
        var html = '<span class="i18n" data-i18n="store_review.owner">' + i18n.t("store_review.owner") + '</span>' + ':\xa0\xa0\xa0' + cmt +
          `<a class="i18n delete_reply i18n" onclick="deleteProductReply(${cid},${pid})" data-i18n="store_review.delete_reply">${i18n.t('store_review.delete_reply')}</a>`;
        $('#' + cid + pid + '.show_product_reply_area').attr("style", "display:block");
        if ($.trim($('#' + cid + p['pid'] + '.show_product_reply_area').html())) {
          html = '\xa0\xa0\xa0' + cmt;
        }
        $('#' + cid + pid + '.show_product_reply_area').append(html);
      }
    }
  }
}


function generateProducts(cid, pList ,hasOrder) {

  $('#' + cid + '.products').attr('style', 'display:block');
  if (pList.length != 0) {
    for (var p of pList) {
      if ($('#' + cid + p['pid'] + '.product_comment').length) {
        $('#' + cid + p['pid'] + '.product_comment').append(p['cmt']);
        return;
      }
      var approved = false;

      if(p['approved']==1)
        approved = true;

      var approv_btn = (hasOrder)?``:(approved)? `<a class="btn btn-outline btn-info pull-right product_disapprove_btn i18n" data-id="${cid}+${p['pid']}" data-i18n="store_review.disapprove"><i class="fa fa-times"></i> ${i18n.t('store_review.disapprove')}</a>`
      :`<a class="btn btn-outline btn-info pull-right product_approve_btn i18n" data-id="${cid}+${p['pid']}" data-i18n="store_review.approve"><i class="fa fa-check"></i> ${i18n.t('store_review.approve')}</a>`;

      var html = `
      <div class="product_single">
      <div class="row m-t-sm">
      <div class="col-lg-4">
      <a style="font-size:15px" class="product_name" id="${cid}${p['pid']}">${p['name']}</a> : <a class="product_comment" id="${cid}${p['pid']}"> ${p['cmt']}</a>
      </div>

      <div class="col-lg-6">
      <div class="show_product_reply_area" id="${cid}${p['pid']}" style="display:none">  </div>
      </div>

      <div class="col-lg-2">
      <a class="btn btn-outline btn-success product_reply_btn pull-right i18n" id="${cid}${p['pid']}" onclick = "editProductReply(${cid},${p['pid']})" data-i18n="store_review.reply"><i class="fa fa-comment"></i> ${i18n.t('store_review.reply')}</a>`
      + approv_btn + 
      `</div>
      </div>
      
      <div class="product_reply_area" id="${cid}${p['pid']}" style="display:none">
                                            
        <div class="form-group">
              <textarea class="product_reply_txt" id="${cid}${p['pid']}" placeholder="${i18n.t("store_review.place_holder")}" maxlength="500"></textarea>
        </div>

        <div class="product_reply-buttom">
        
        <span class="replyInput_reminder i18n pull-left"> <span data-i18n="store_review.reply_entered">${i18n.t('store_review.reply_entered')}</span>  
        <span class="replyInput_reminder_words" id="${cid}${p['pid']}">0</span>
        <span data-i18n="store_review.reply_words">${i18n.t('store_review.reply_words')}</span>
        <span data-i18n="store_review.reply_limit">${i18n.t('store_review.reply_limit')}</span>
        </span>
        <div class="product_reply_buttons pull-right" id="${cid}${p['pid']}">
        <button class="btn btn-warning i18n" type="button" id="btn_cancel_reply" onclick ="cancelProductReply(${cid},${p['pid']})" data-i18n="common.cancel">${i18n.t('common.cancel')}</button>
        <button class="btn btn-primary i18n" type="button" id="btn_send_reply" onclick ="sendProductReply(${cid},${p['pid']})" data-i18n="store_review.send_product">${i18n.t('store_review.send_product')}</button>
        </div>
        </div>

      </div>
      </div>
      `;
      $('#' + cid + '.products').append(html);
    }
  }
  $('#'+cid + p['pid']+'.product_reply_txt').on('input', function() { 
    var words = $('#' + $(this).attr('id') +'.replyInput_reminder_words');
    words.html('');
    words.html($(this).val().length);
  });
}

function generateImgs(cid, imgList) {
  $('#' + cid + '.photos').attr('style', 'display:block');
  var modalHtml = `
  <div class="modal inmodal fade imgmodal" id="${cid}">
  <div class="modal-dialog modal-sx">
  <div class="modal-content">
      <div class="modal-header" style="height:12px">
      <button type="button" class="close cancel-button" data-dismiss="modal" style="margin-top:0; font-size:20px;"><span>×</span></button>
      </div>
      
      <div class="modal-body" id="${cid}" align="center">
      
      </div>
  </div>
  </div>
</div>
  `;
  if (!$('#' + cid + '.modal').length)
    $('#' + cid + '.photos').append(modalHtml);

  var count = $('#' + cid + '.modal-body').children().length;
  for (var img of imgList) {
    count++;
    img_in_gallery[cid] = count;
    var url = (CLOUDINARY + "/" + img);
    var html = `<a> <img alt="image" class="feed-photo" onclick="PopUpImgWindow(${cid},${count})" src=${url}></a>`;
    var iHtml = `<div class="feed-photo-gallery" id="${cid}${count}" style='display:none'>
    <button type="button" class="btn btn-white i18n pull-left gallery_btn prev_btn" id="${cid}${count}" onclick="prevImg(${cid},${count})"}><i class="fa fa-chevron-left"></i></button>
    <img alt="image" class="gallery_img" src=${url}>
    <button type="button" class="btn btn-white i18n pull-right gallery_btn next_btn" id="${cid}${count}" onclick="nextImg(${cid},${count})"><i class="fa fa-chevron-right"></i></button>
    </div>`;


    $('#' + cid + '.modal-body').append(iHtml);

    $('#' + cid + '.photos').append(html);
  }

}

//for pop up gallery
function PopUpImgWindow(cid, n) {
  $('.feed-photo-gallery').attr('style', 'display:none');
  $('#' + cid + n + '.feed-photo-gallery').attr('style', 'display:block');

  if (n == 1)
    $('#' + cid + n + '.prev_btn').attr('disabled', 'disabled');

  if (n == img_in_gallery[cid])
    $('#' + cid + n + '.next_btn').attr('disabled', 'disabled');

  $('#' + cid + '.modal').modal('show');
}

function prevImg(cid, n) {
  PopUpImgWindow(cid, n - 1);
}

function nextImg(cid, n) {
  PopUpImgWindow(cid, n + 1);
}

function generateReviews(page, usingId, name, serviceCommentList, date ,hasOrder,approved) {
  var serviceComment = (serviceCommentList.length == 0) ? "" : serviceCommentList.reduce(function (a, b) { return a + ", " + b });
  var feed_block_header = (hasOrder)?`<div class="feed-element with-order">`:`<div class="feed-element no-order">`;
  var approv_btn = (hasOrder)?``:(approved)? `<a class="btn btn-outline btn-info pull-right disapprove_btn i18n" data-id="${usingId}" data-i18n="store_review.disapprove"><i class="fa fa-times"></i> ${i18n.t('store_review.disapprove')}</a>`
  :`<a class="btn btn-outline btn-info pull-right approve_btn i18n" data-id="${usingId}" data-i18n="store_review.approve"><i class="fa fa-check"></i> ${i18n.t('store_review.approve')}</a>`;
  
  var html = feed_block_header +
  `
  <a href="#" class="pull-left">
      <img alt="image" class="img-circle" src="img/a6.jpg">
  </a>
  <div class="media-body">
      <strong class="customer_name">${name}</strong> <br/>
      <small class="text-muted pull-right" style="font-size:12px" class="date" id="${usingId}">${date}</small>
      <div class="rates_area" id="${usingId}"> </div>
      <div class="service_comment_area" id="${usingId}" style="display:none">
      </div>
      <div class="products" id="${usingId}" style="display:none">                          
      </div>
      <div class="photos" id="${usingId}" style="display:none">
      </div>
      
      <div class="row m-t-sm" style="display:${(serviceCommentList.length == 0) ? "none" : "block"}">
      <div class="col-lg-12">
      
      <a class="btn btn-outline btn-success pull-right service_reply_btn i18n" onclick = "editReply(${usingId})" data-i18n="store_review.reply"><i class="fa fa-comments-o"></i> ${i18n.t('store_review.reply')}</a>`
      + approv_btn +
      `</div>
      </div>


      <div class="reply_area" id="${usingId}" style="display:none">
                                                
        <div class="form-group">
              <textarea class="reply_txt" id="${usingId}" placeholder="${i18n.t("store_review.place_holder")}" maxlength="500"></textarea>
        </div>
      
        <div class="reply-buttom">         
        <span class="replyInput_reminder i18n pull-left"> <span data-i18n="store_review.reply_entered">${i18n.t('store_review.reply_entered')}</span>  
        <span class="replyInput_reminder_words" id="${usingId}">0</span>
        <span data-i18n="store_review.reply_words">${i18n.t('store_review.reply_words')}</span>
        <span data-i18n="store_review.reply_limit">${i18n.t('store_review.reply_limit')}</span>
        </span>
          
          <div class="review_reply_buttons pull-right">

          <button class="btn btn-warning i18n" type="button" id="btn_cancel_reply" onclick ="cancelReply(${usingId})" data-i18n="common.cancel">${i18n.t('common.cancel')}</button>
          <button class="btn btn-primary i18n" type="button" id="btn_send_reply" onclick ="sendReply(${usingId})" data-i18n="store_review.send">${i18n.t('store_review.send')}</button>
      
          </div>        
        </div>
    
      </div>
      <div class="show_reply_area" id="${usingId}" style="display:none">
      </div>
  </div> 
 </div>
 `;

  $('#page_' + page).append(html);
  $('#'+ usingId +'.reply_txt').on('input', function() { 
    var words = $('#' + usingId +'.replyInput_reminder_words');
    words.html('');
    words.html($(this).val().length);
  });
}

function approveStoreReview(cid){
  cid = parseInt(cid);
  console.log('now apprive store review',cid,gid);
  return new Promise(function(resolve,reject){
    var data = {
      type: "POST",
      action: "reply",
      "data": {
        "data": {
          "gid": gid,
          "cid": cid,
          "s_review":{
            "general":{
              "approved":1
            }
          }
        }
      }
    };
    console.log("sending",data);
    $.ajax({
      url: "/oauth/",
      type: "POST",
      data: data,
      dataType: "json",
      error: function () { }
    }).done(function (res) {
      console.log('res',res);
      if (res['RC'] == 200) {//asdasd
        swal({
          title: i18n.t('store_review.approve_success'),
          type: "warning",
          confirmButtonText: i18n.t('common.ok')
        });
        resolve();
      } else {
        swal({
          title: i18n.t('store_review.approve_failed'),
          type: "warning",
          confirmButtonText: i18n.t('common.ok')
        });
        reject();
      }
    });
  });
}

function disapproveStoreReview(cid){
  return new Promise(function(resolve,reject){
    var data = {
      type: "POST",
      action: "reply",
      "data": {
        "data": {
          "gid": gid,
          "cid": cid,
          "s_review":{
            "general":{
              "approved":0
            }
          }
        }
      }
    };


    $.ajax({
      url: "/oauth/",
      type: "POST",
      data: data,
      dataType: "json",
      error: function () { }
    }).done(function (res) {

      if (res['RC'] == 200) {
        swal({
          title: i18n.t('store_review.disapprove_success'),
          type: "warning",
          confirmButtonText: i18n.t('common.ok')
        });
        resolve();
      } else {
        swal({
          title: i18n.t('store_review.disapprove_failed'),
          type: "warning",
          confirmButtonText: i18n.t('common.ok')
        });
        reject();
      }
    });
  });
}

function approveProductReview(id){
  return new Promise(function(resolve,reject){
    var cid = id.split('+')[0];
    var pid = id.split('+')[1];
    var data = {
      type: "POST",
      action: "reply",
      "data": {
        "data": {
          "gid": gid,
          "cid": cid,
          "p_review":[{
            "pid":pid,
            "approved":1
          }]
        }
      }
    };

    $.ajax({
      url: "/oauth/",
      type: "POST",
      data: data,
      dataType: "json",
      error: function () { }
    }).done(function (res) {
      if (res['RC'] == 200) {
        swal({
          title: i18n.t('store_review.approve_success'),
          type: "warning",
          confirmButtonText: i18n.t('common.ok')
        });
        resolve();
      } else {
        swal({
          title: i18n.t('store_review.approve_failed'),
          type: "warning",
          confirmButtonText: i18n.t('common.ok')
        });
        reject();
      }
    });
  });
}

function disapproveProductReview(id){
  return new Promise(function(resolve,reject){
    var cid = id.split('+')[0];
    var pid = id.split('+')[1];
    var data = {
      type: "POST",
      action: "reply",
      "data": {
        "data": {
          "gid": gid,
          "cid": cid,
          "p_review":[{
            "pid":pid,
            "approved":0
          }]
        }
      }
    };

    $.ajax({
      url: "/oauth/",
      type: "POST",
      data: data,
      dataType: "json",
      error: function () { }
    }).done(function (res) {
      if (res['RC'] == 200) {
        swal({
          title: i18n.t('store_review.disapprove_success'),
          type: "warning",
          confirmButtonText: i18n.t('common.ok')
        });
        resolve();
      } else {
        swal({
          title: i18n.t('store_review.disapprove_failed'),
          type: "warning",
          confirmButtonText: i18n.t('common.ok')
        });
        reject();
      }
    });
  });
}

function editReply(cid) {
  $('#' + cid + '.reply_area').attr("style", "display:block");
  // $('#'+ cid+'.product_reply_buttons').attr("style","display:none");
  $('#' + cid + '.review_reply_buttons').attr("style", "display:block");
}

function editProductReply(cid, pid) {
  $('#' + cid + pid + '.product_reply_area').attr("style", "display:block");
}

function cancelReply(cid) {
  $('#' + cid + '.reply_txt').val('');
  $('#' + cid +'.replyInput_reminder_words').html('0');
  $('#' + cid + '.reply_area').attr("style", "display:none");
}

function cancelProductReply(cid, pid) {
  $('#' + cid + pid + '.product_reply_txt').val('');
  $('#' + cid + pid +'.replyInput_reminder_words').html('0');
  $('#' + cid + pid + '.product_reply_area').attr("style", "display:none");
}

function sendReply(cid) {
  var cid_length = cid.toString().length;
  var txt = $('#' + cid + '.reply_txt').val();
  // var txt=null;
  if (txt.length == 0) {
    swal({
      title: i18n.t('store_review.empty_input'),
      type: "warning",
      confirmButtonText: i18n.t('common.ok')
    });
    return;
  }
  if (cid_length > 6) {
    var data = {
      type: "POST",
      action: "reply",
      "data": {
        "data": {
          "oid": cid,
          "s_response": txt,
        }
      }
    };
  }
  else {
    var data = {
      type: "POST",
      action: "reply",
      "data": {
        "data": {
          "gid": gid,
          "cid": cid,
          "s_response": txt,
        }
      }
    };
  }

  $.ajax({
    url: "/oauth/",
    type: "POST",
    data: data,
    dataType: "json",
    error: function () { }
  }).done(function (res) {

    if (res['RC'] == 200) {
      $('#' + cid + '.reply_area').attr("style", "display:none");
      var html = `${i18n.t("store_review.owner")}:&nbsp&nbsp${txt}
      <a class="i18n delete_reply" onclick="deleteReply(${cid})">${i18n.t('store_review.delete_reply')}</a>
      `;
      $('#' + cid + '.show_reply_area').html(html);
      $('#' + cid + '.show_reply_area').attr("style", "display:block");
    } else {
      swal({
        title: i18n.t('store_review.reply_failed'),
        type: "warning",
        confirmButtonText: i18n.t('common.ok')
      });
    }
  });
}

function sendProductReply(cid, pid) {
  var cid_length = cid.toString().length;
  var txt = $('#' + cid + pid + '.product_reply_txt').val();
  if (txt.length == 0) {
    swal({
      title: i18n.t('store_review.empty_input'),
      type: "warning",
      confirmButtonText: i18n.t('common.ok')
    });
    return;
  }
  if (cid_length > 6) {
    var data = {
      type: "POST",
      action: "reply",
      "data": {
        "data": {
          "oid": cid,
          "p_review": [{
            "pid": pid,
            "s_response": txt
          }],
        }
      }
    };
  }
  else {
    var data = {
      type: "POST",
      action: "reply",
      "data": {
        "data": {
          "gid": gid,
          "cid": cid,
          "p_review": [{
            "pid": pid,
            "s_response": txt
          }],
        }
      }
    };
  }

  $.ajax({
    url: "/oauth/",
    type: "POST",
    data: data,
    dataType: "json",
    error: function () { }
  }).done(function (res) {

    if (res['RC'] == 200) {
      $('#' + cid + pid + '.product_reply_area').attr("style", "display:none");

      var html = `${i18n.t("store_review.owner")}:&nbsp&nbsp${txt}
      <a class="i18n delete_reply" onclick="deleteProductReply(${cid},${pid})">${i18n.t('store_review.delete_reply')}</a>
      `;
      $('#' + cid + pid + '.show_product_reply_area').html(html);
      $('#' + cid + pid + '.show_product_reply_area').attr("style", "display:block");
    } else {
      swal({
        title: i18n.t('store_review.reply_failed'),
        type: "warning",
        confirmButtonText: i18n.t('common.ok')
      });
    }
  });
}

function deleteReply(cid) {
  swal({
    title: i18n.t('store_review.alert_are_you_sure'),
    text: i18n.t('store_review.alert_delete_reply'),
    type: "warning",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    closeOnConfirm: true
  }, function () {
    if (cid.length > 6) {
      var data = {
        type: "POST",
        action: "reply",
        "data": {
          "data": {
            "oid": cid,
            "s_response": null,
          }
        }
      };
    }
    else {
      var data = {
        type: "POST",
        action: "reply",
        "data": {
          "data": {
            "gid": gid,
            "cid": cid,
            "s_response": null,
          }
        }
      };
    }

    $.ajax({
      url: "/oauth/",
      type: "POST",
      data: data,
      dataType: "json",
      error: function () { }
    }).done(function (res) {
      if (res['RC'] == 200) {
        $('#' + cid + '.show_reply_area').attr("style", "display:none");
      } else {
        swal({
          title: i18n.t('store_review.reply_failed'),
          type: "warning",
          confirmButtonText: i18n.t('common.ok')
        });
      }
    });
  });
}

function deleteProductReply(cid, pid) {
  swal({
    title: i18n.t('store_review.alert_are_you_sure'),
    text: i18n.t('store_review.alert_delete_reply'),
    type: "warning",
    showCancelButton: true,
    confirmButtonColor: "#DD6B55",
    closeOnConfirm: true
  }, function () {
    if (cid.length > 6) {
      var data = {
        type: "POST",
        action: "reply",
        "data": {
          "data": {
            "oid": cid,
            "p_review": [{
              "pid": pid,
              "s_response": null
            }],
          }
        }
      };
    }
    else {
      var data = {
        type: "POST",
        action: "reply",
        "data": {
          "data": {
            "gid": gid,
            "cid": cid,
            "p_review": [{
              "pid": pid,
              "s_response": null
            }],
          }
        }
      };
    }

    $.ajax({
      url: "/oauth/",
      type: "POST",
      data: data,
      dataType: "json",
      error: function () { }
    }).done(function (res) {
      if (res['RC'] == 200) {
        $('#' + cid + pid + '.show_product_reply_area').attr("style", "display:none");
      } else {
        swal({
          title: i18n.t('store_review.delete_failed'),
          type: "warning",
          confirmButtonText: i18n.t('common.ok')
        });
      }
    });
  });
}

function createPaginationBar(flag) {
  if (usingPages > 1) {
    for (var i = 1; i <= usingPages; i++) {
      if (flag != 1)
        $('.pagination-lg').append(`<li><a href="#" onclick="showPages('${i}')">${i}</a></li>`);
      else
        $('.pagination-lg-not-replied').append(`<li><a href="#" onclick="showPages('${i}')">${i}</a></li>`);
    }
  }
}

function showPages(id) {
  for (var i = 1; i <= usingPages; i++) {
    if (i != id)
      $('#page_' + i).attr('style', 'display:none');

    else
      $('#page_' + i).attr('style', 'display:block');
  }
}

$(".feed-photo").on("click", function () {
  window.open($("img").attr("src"), "_blank", "menubar=1,resizable=1");
});



$(document).ready(function () {
  //initial plugin
  $('.footable').footable();

  //initial data
  gid = $data['storeDetail']['general_info']['g_id'];
  // formReviewFrame();
  var dateTo = moment().format('MM/DD/YYYY');
  var dateFrom = moment().subtract(7,'d').format('MM/DD/YYYY');

  $('.filter_by_time').append('<input onclick="showDateTimePicker()" class="form-control btn-outline filter-btn i18n" type="text" name="daterange" value="'+dateFrom+ ' - ' +dateTo+'" />');

  getReviewList(reviewAll, 0);

  var $filter_btns = $('.filter-btn').click(function(e) {
		$filter_btns.removeClass('highLight');
		$(this).addClass('highLight');
  });


  $('.feed-activity-list').on('click','.approve_btn',function(){
    var id = $(this).attr('data-id');
    var $this = $(this);
    approveStoreReview(id).then(function(){
      console.log("success approved");
      var html = `<a class="btn btn-outline btn-info pull-right disapprove_btn i18n" data-id="${id}" data-i18n="store_review.disapprove"><i class="fa fa-times"></i> ${i18n.t('store_review.disapprove')}</a>`;
      $this.replaceWith(html);
    });
  })

  $('.feed-activity-list').on('click','.disapprove_btn',function(){
    var id = $(this).attr('data-id');
    var $this = $(this);
    disapproveStoreReview(id).then(function(){
      var html = `<a class="btn btn-outline btn-info pull-right approve_btn i18n" data-id="${id}" data-i18n="store_review.approve"><i class="fa fa-check"></i> ${i18n.t('store_review.approve')}</a>`;
      $this.replaceWith(html);
    });
  })

  $('.feed-activity-list').on('click','.product_approve_btn',function(){
    var id = $(this).attr('data-id');
    var $this = $(this);
    approveProductReview(id).then(function(){
      var html = `<a class="btn btn-outline btn-info pull-right product_disapprove_btn i18n" data-id="${id}" data-i18n="store_review.disapprove"><i class="fa fa-times"></i> ${i18n.t('store_review.disapprove')}</a>`;
      $this.replaceWith(html);
    })
    .catch(function(){
      console.log('approve failed');
    });
  })

  $('.feed-activity-list').on('click','.product_disapprove_btn',function(){
    var id = $(this).attr('data-id');
    var $this = $(this);
    disapproveProductReview(id).then(function(){
      var html = `<a class="btn btn-outline btn-info pull-right product_approve_btn i18n" data-id="${id}" data-i18n="store_review.approve"><i class="fa fa-check"></i> ${i18n.t('store_review.approve')}</a>`;
      $this.replaceWith(html);
    });
  })

});






