

<link rel="stylesheet" href="/plugins/footable-bootstrap/css/footable.bootstrap.min.css">
<link href="/css/page/store_review.css" rel="stylesheet">
<link href="/font-awesome/css/font-awesome.css" rel="stylesheet">
<link href="/css/plugins/daterangepicker/daterangepicker-bs3.css" rel="stylesheet">


<body>

    <div id="wrapper">

    

        <div class="gray-bg">


        <div class="row wrapper border-bottom white-bg page-heading">
          <div class="col-lg-12">
            <h2 class="i18n" data-i18n="store_review.title"></h2>
            <ol class="breadcrumb">
              <li>
                <a href="/" class="i18n" data-i18n="common.home"></a>
              </li>
              <li class="active">
                <strong class="i18n" data-i18n="store_review.title"></strong>
              </li>
            </ol>
          </div>
        </div>

        <div class="row">
            <div class="col-lg-12">
                <div class="wrapper wrapper-content animated fadeInRight ecommerce">
                    <div class="ibox">
                        <div class="ibox-content">

                            <div class="summary">
                            <div class="row">
                                <div class="col-lg-12">
                                    <div class="m-b-md">
                                    <p class="pull-right"><strong class="i18n" data-i18n="store_review.last_update"></strong><?= $storeDetail['general_info']['last_publish'] ?></p>
                                        <!-- <a href="#" class="btn btn-white btn-xs pull-right">Someting here</a> -->
                                        <h2 style="margin-left:4px"><?= $storeDetail['general_info']['store_nm']['en']?></h2>
                                    </div>
      
                                </div>
                            </div>
                            <div class="row">
                                <div style="margin-left:16px">
                                    <div id="overall_rate">

         
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-lg-12">
                                    <dl class="dl-horizontal">
                                      
                                        <div>
                                            <div class="progress progress-striped active m-b-sm">
                                                <div class="progress-bar"></div>
                                            </div>
                                            <span class="i18n text_content" data-i18n="store_review.positive_ratio_txt"></span>
                                            <strong class="positive_ratio text_content"></strong>
                                             . <b class="positive_number text_content text_content"></b> <span class="i18n text_content" data-i18n="store_review.positive_reviews"> </span>

                                             <span class="pull-right text_content"><b class="negative_number"></b> <span class="i18n" data-i18n="store_review.negative_reviews"></span></span>
                                             <span class="pull-right text_content"><b class="no_rate_number"></b> <span class="i18n" data-i18n="store_review.unrated_reviews"></span> </span>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                            </div>

                            <div class="row m-t-sm" style="margin-top:80px">
                                <div class="col-lg-12">
                                <div class="panel blank-panel">
                                <div class="panel-heading">
                                    <div class="panel-options">
                                        <ul class="nav nav-tabs">
                                            <li class="active"><a href="#tab-1" onclick="getReviewList(reviewAll,0)" data-toggle="tab" class="panel_tab i18n" data-i18n="store_review.reviews"></a></li>
                                            <li class=""><a href="#tab-2" onclick="getReviewList(reviewAll,1)" data-toggle="tab" class="panel_tab i18n" data-i18n="store_review.not_replied"></a></li>
                                        </ul>
                                    </div>
                                </div>

                                <div class="panel-body">

                                    <div class="tab-content">
                                        <div class="tab-pane active" id="tab-1">

                                            <div class="button-panel">
                                            <div class="row m-t-sm" style="display:flex">
                                               
                                                <div class="filter_type col-lg-1 i18n" data-i18n="store_review.time"></div>
                                                <div class="filter_by_time col-lg-11">
                                                <button type="button" onclick="getReviewList(reviewAll,2)" class="btn-outline filter-btn i18n" data-i18n="store_review.in_a_week"></button>
                                                <button type="button" onclick="getReviewList(reviewAll,3)" class="btn-outline filter-btn i18n" data-i18n="store_review.in_a_month"></button>
                                                <!-- <input onclick="showDateTimePicker()" class="form-control btn-outline filter-btn i18n" type="text" name="daterange" value="05/01/2018 - 05/31/2018" /> -->
                                                <!-- <button type="button" onclick="showDateTimePicker()" class="btn btn-outline filter-btn i18n" id="custom_time" data-i18n="store_review.custom_time"></button> -->
                       
                                                </div>

                                            </div>

                                             <div class="row m-t-sm" style="display:flex">
                                              
                                                <div class="filter_type col-lg-1 i18n" data-i18n="store_review.order"></div>
                                                <div class="filter_by_rate col-lg-11">
                                                <button type="button" onclick="getReviewList(reviewAll,0)" class="btn-outline filter-btn i18n" data-i18n="store_review.all_review"></button>                                                
                                                <button type="button" onclick="getReviewList(reviewAll,7)" class="btn-outline filter-btn i18n" data-i18n="store_review.with_order"></button>
                                                <button type="button" onclick="getReviewList(reviewAll,8)" class="btn-outline filter-btn i18n" data-i18n="store_review.no_order"></button>
                                                </div>
                                                
                                            </div>

                                            <div class="row m-t-sm" style="display:flex">
                                              
                                                <div class="filter_type col-lg-1 i18n" data-i18n="store_review.rate"></div>
                                                <div class="filter_by_rate col-lg-11">
                                                <button type="button" onclick="getReviewList(reviewAll,5)" class="btn-outline filter-btn i18n" data-i18n="store_review.bad_review"></button>
                                                <button type="button" onclick="getReviewList(reviewAll,6)" class="btn-outline filter-btn i18n" data-i18n="store_review.good_review"></button>
                                                </div>
                                                
                                            </div>
                                            
                                            </div>

                  

                                            <div class="feed-activity-list" style="margin-top:76px">
                                            <!-- test elements here -->
                                                
                                            <!-- test elements end -->

                                            </div>

                                            <div class="page_list">
                                                <div class="text-center">
                                                <ul class="pagination pagination-lg">

                                                </ul>
                                                </div>
                                            </div>


                                        </div>
                                        <div class="tab-pane" id="tab-2">

                                            <div class="feed-activity-list-not-replied">
                                            <!-- test elements here -->
                                
                                            <!-- test elements end -->

                                            </div>

                                            <div class="page_list">
                                                <div class="text-center">
                                                <ul class="pagination pagination-lg-not-replied">

                                                </ul>
                                                </div>
                                            </div>

                                        </div>
                                    </div>

                                </div>

                                </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        
        <!-- <div class="page_list">
          <div class="text-center">
              <ul class="pagination pagination-lg">
            
              </ul>
          </div>
      </div> -->

        <!-- <div class="footer">
            <div class="pull-right">
                10GB of <strong>250GB</strong> Free.
            </div>
            <div>
                <strong>Copyright</strong> Example Company &copy; 2014-2017
            </div>
        </div> -->

        </div>
    </div>

    <!-- Mainly scripts -->
    <script src="/plugins/footable-bootstrap/js/footable.js"></script>
<script src="/js/plugins/twbsPagination/jquery.twbsPagination.min.js"></script>
<script src="/plugins/moment/moment.min.js"></script>
<script src="/plugins/moment/moment-timezone.js"></script>
<script src="/plugins/bootstrap-datetimepicker/bootstrap-datetimepicker.min.js"></script>
<script src="/js/plugins/daterangepicker/daterangepicker.js"></script>
<script src="/js/page/store_review.js"></script>



    <script>
      $data['storeDetail'] = <?=JSON_encode($storeDetail)?>;
      $data['profile'] = <?=JSON_encode($_SESSION['profile'])?>;
      CURRENCY_MAPPING = <?=JSON_encode(CURRENCY_MAPPING)?>;
      window.CLOUDINARY = <?=JSON_encode(CLOUDINARY)?>;
      $data['googleAddressMapping'] = {
        'street_number': 'street',
        'route': 'street',
        'locality': 'city',
        'administrative_area_level_1': 'province',
        'country': 'country_code',
        'postal_code': 'post_code',
      };
      if ($.isEmptyObject($data['storeDetail']["store_addr"]["timezone"])) {
        $data['storeDetail']["store_addr"]["timezone"] = 'America/New_York';
      }
      DOMAIN = <?=JSON_encode(DOMAIN)?>;
    </script>
