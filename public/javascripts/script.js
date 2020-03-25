$(function() {
  var makeToggle = function() {
    $(function() {
      $(".toggle-event").bootstrapToggle({
        on: "Active",
        off: "Deactive",
        offstyle: "warning"
      });
    });
  };
  $("#userList").DataTable({
    aLengthMenu: [
      [5, 10, 25, 50, 100],
      [5, 10, 25, 50, 100]
    ],
    iDisplayLength: 5,
    // processing: true,
    serverSide: true,
    ajax: {
      url: "/user/ajax/userlist",
      type: "POST"
    },
    columns: [{ data: "first_name" }, { data: "last_name" }, { data: "email" }, { data: "status" }],
    columnDefs: [
      {
        targets: 3,
        data: "status",
        render: function(data, type, row, meta) {
          let status = "";
          if (data) {
            status = "checked";
          }
          let html = `
            <input class="toggle-event" type="checkbox" data-toggle="toggle" data-onstyle="success" data-size="sm" data-id="${row.id}" ${status}/>
            `;
          return html;
        }
      },
      {
        targets: 4,
        data: null,
        render: function(data, type, row, meta) {
          let html = `
          <a href="/user/edit/${row.id}" class="btn btn-success btn-sm margin_bt">Edit</a> <button class="btn btn-danger btn-sm deleteUser margin_bt"  data-id="${row.id}" >Delete</button>
          <a href="/order/list/user/${row.id}" class="btn btn-success btn-sm margin_bt">View Orders</a>`;
          return html;
        }
      },
      { orderable: false, searchable: false, targets: -1 }
    ],
    fnDrawCallback: function(oSettings) {
      makeToggle();
    }
  });

  $("#interviewList").DataTable({
    aLengthMenu: [
      [5, 10, 25, 50, 100],
      [5, 10, 25, 50, 100]
    ],
    iDisplayLength: 5,
    // processing: true,
    serverSide: true,
    ajax: {
      url: "/interview/ajax/list",
      type: "POST"
    },
    columns: [{ data: "title" }, { bSortable: false, data: "youtube_url" }, { data: "interview_release" }, { bSortable: false, data: "description" }],
    columnDefs: [
      {
        targets: 4,
        data: null,
        render: function(data, type, row, meta) {
          console.log("row", row);
          let html = `
            <a href="/interview/edit/${row.id}" class="btn btn-success btn-sm margin_bt">Edit</a> <button class="btn btn-danger btn-sm deleteInterview margin_bt"  data-id="${row.id}" >Delete</button>
            `;
          return html;
        }
      },
      {
        targets: 1,
        data: null,
        render: function(data, type, row, meta) {
          let html = `
          <a href="${row.youtube_url}" >${row.youtube_url}</a>
            `;
          return html;
        }
      },
      {
        targets: 2,
        data: null,
        render: function(data, type, row, meta) {
          let html = moment(row.interview_release).format("YYYY-MM-DD");
          return html;
        }
      },
      { orderable: false, searchable: false, targets: -1 }
    ],
    fnDrawCallback: function(oSettings) {
      makeToggle();
    }
  });

  $("#interviewList").on("click", ".deleteInterview", function() {
    var evt = $(this);
    var id = $(this).attr("data-id");
    var interviewtable = $("#interviewList").DataTable();
    $.ajax({
      type: "post",
      url: "/interview/delete/" + id,
      success: function(response) {
        interviewtable
          .row(evt.parents("tr"))
          .remove()
          .draw();
      },
      error: function(status) {
        var html = `
          <div class="row mb-3 aj-err">
          <div class="alert alert-danger col-md-12 alert-dismissible fade show" role="alert">
            <strong>Error!</strong> There is something went wrong when perform this action. Please refresh this page and try again.
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
          `;
        $(".card-body")
          .find(".aj-err")
          .remove();
        $(".card-body").prepend(html);
      }
    });
  });

  $("#eventList").DataTable({
    aLengthMenu: [
      [5, 10, 25, 50, 100],
      [5, 10, 25, 50, 100]
    ],
    iDisplayLength: 5,
    // processing: true,
    serverSide: true,
    ajax: {
      url: "/events/ajax/eventslist",
      type: "POST"
    },
    columns: [
      { data: "event_title" },
      { data: "organized_by" },
      { data: "description" },
      { data: "category" },
      { data: "event_date" },
      { data: "event_time" },
      { bSortable: false, data: "description" }
    ],
    columnDefs: [
      {
        targets: 7,
        data: null,
        render: function(data, type, row, meta) {
          let html = `
          <a href="/events/edit/${row.id}" class="btn btn-success btn-sm margin_bt">Edit</a> <button class="btn btn-danger btn-sm delete_event margin_bt"  data-id="${row.id}" >Delete</button>
          `;
          return html;
        }
      },
      {
        targets: 4,
        data: null,
        render: function(data, type, row, meta) {
          let html = moment(row.event_date).format("YYYY-MM-DD");
          return html;
        }
      },
      { orderable: false, searchable: false, targets: 1 }
    ],
    fnDrawCallback: function(oSettings) {
      makeToggle();
    }
  });

  $("#eventList").on("click", ".delete_event", function() {
    var evt = $(this);
    var id = $(this).attr("data-id");
    var interviewtable = $("#eventList").DataTable();
    $.ajax({
      type: "post",
      url: "/events/delete/" + id,
      success: function(response) {
        interviewtable
          .row(evt.parents("tr"))
          .remove()
          .draw();
      },
      error: function(status) {
        var html = `
        <div class="row mb-3 aj-err">
        <div class="alert alert-danger col-md-12 alert-dismissible fade show" role="alert">
          <strong>Error!</strong> There is something went wrong when perform this action. Please refresh this page and try again.
          <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>
        `;
        $(".card-body")
          .find(".aj-err")
          .remove();
        $(".card-body").prepend(html);
      }
    });
  });

  $("#musicList").DataTable({
    aLengthMenu: [
      [5, 10, 25, 50, 100],
      [5, 10, 25, 50, 100]
    ],
    iDisplayLength: 5,
    // processing: true,
    serverSide: true,
    ajax: {
      url: "/music/ajax/list",
      type: "POST"
    },
    columns: [
      { data: "title" },
      { data: "singer" },
      { bSortable: false, data: "youtube_url" },
      { data: "music_release" },
      { bSortable: false, data: "description" }
    ],
    columnDefs: [
      {
        targets: 5,
        data: null,
        render: function(data, type, row, meta) {
          let html = `
            <a href="/music/edit/${row.id}" class="btn btn-success btn-sm margin_bt">Edit</a> <button class="btn btn-danger btn-sm deleteMusics margin_bt"  data-id="${row.id}" >Delete</button>
            `;
          return html;
        }
      },
      {
        targets: 2,
        data: null,
        render: function(data, type, row, meta) {
          let html = `
            <a href="${row.youtube_url}" >${row.youtube_url}</a>
            `;
          return html;
        }
      },
      {
        targets: 3,
        data: null,
        render: function(data, type, row, meta) {
          let html = moment(row.music_release).format("YYYY-MM-DD");
          return html;
        }
      },
      { orderable: false, searchable: false, targets: -1 }
    ],
    fnDrawCallback: function(oSettings) {
      makeToggle();
    }
  });

  $("#musicList").on("click", ".deleteMusics", function() {
    var evt = $(this);
    var id = $(this).attr("data-id");
    var musictable = $("#musicList").DataTable();
    $.ajax({
      type: "post",
      url: "/music/delete/" + id,
      success: function(response) {
        musictable
          .row(evt.parents("tr"))
          .remove()
          .draw();
      },
      error: function(status) {
        var html = `
          <div class="row mb-3 aj-err">
          <div class="alert alert-danger col-md-12 alert-dismissible fade show" role="alert">
            <strong>Error!</strong> There is something went wrong when perform this action. Please refresh this page and try again.
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
          `;
        $(".card-body")
          .find(".aj-err")
          .remove();
        $(".card-body").prepend(html);
      }
    });
  });

  $("#userList").on("click", ".deleteUser", function() {
    var evt = $(this);
    var id = $(this).attr("data-id");
    var usertable = $("#userList").DataTable();
    $.ajax({
      type: "post",
      url: "/user/delete/" + id,
      success: function(response) {
        usertable
          .row(evt.parents("tr"))
          .remove()
          .draw();
      },
      error: function(status) {
        var html = `
          <div class="row mb-3 aj-err">
          <div class="alert alert-danger col-md-12 alert-dismissible fade show" role="alert">
            <strong>Error!</strong> There is something went wrong when perform this action. Please refresh this page and try again.
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
          `;
        $(".card-body")
          .find(".aj-err")
          .remove();
        $(".card-body").prepend(html);
      }
    });
  });

  $("#userList").on("change", ".toggle-event", function() {
    var evt = $(this);
    var id = $(this).attr("data-id");
    var status = $(this).is(":checked") ? "Active" : "Deactive";
    $.ajax({
      type: "post",
      url: "/user/change-status/" + id,
      data: {
        status: status
      },
      dataType: "json",
      success: function(response) {
        if (!response.success) {
          var html = `
            <div class="row mb-3 aj-err">
            <div class="alert alert-danger col-md-12 alert-dismissible fade show" role="alert">
              <strong>Error!</strong> There is something went wrong when perform this action. Please refresh this page and try again.
              <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          </div>
            `;
          $(".card-body")
            .find(".aj-err")
            .remove();
          $(".card-body").prepend(html);
        }
      }
    });
  });

  $("#embedList").DataTable({
    aLengthMenu: [
      [5, 10, 25, 50, 100],
      [5, 10, 25, 50, 100]
    ],
    iDisplayLength: 5,
    // processing: true,
    serverSide: true,
    ajax: {
      url: "/embed/ajax/list",
      type: "POST"
    },
    columns: [{ data: "title" }, { bSortable: false, data: "youtube_url" }],
    columnDefs: [
      {
        targets: 2,
        data: null,
        render: function(data, type, row, meta) {
          console.log("row", row);
          let html = `
            <a href="/embed/edit/${row.id}" class="btn btn-success btn-sm margin_bt">Edit</a> <button class="btn btn-danger btn-sm deleteEmbed margin_bt"  data-id="${row.id}" >Delete</button>
            `;
          return html;
        }
      },
      {
        targets: 1,
        data: null,
        render: function(data, type, row, meta) {
          let html = `
          <a href="${row.youtube_url}" >${row.youtube_url}</a>
            `;
          return html;
        }
      },
      { orderable: false, searchable: false, targets: -1 }
    ],
    fnDrawCallback: function(oSettings) {
      makeToggle();
    }
  });

  $("#embedList").on("click", ".deleteEmbed", function() {
    var evt = $(this);
    var id = $(this).attr("data-id");
    var embedtable = $("#embedList").DataTable();
    $.ajax({
      type: "post",
      url: "/embed/delete/" + id,
      success: function(response) {
        embedtable
          .row(evt.parents("tr"))
          .remove()
          .draw();
      },
      error: function(status) {
        var html = `
          <div class="row mb-3 aj-err">
          <div class="alert alert-danger col-md-12 alert-dismissible fade show" role="alert">
            <strong>Error!</strong> There is something went wrong when perform this action. Please refresh this page and try again.
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
          `;
        $(".card-body")
          .find(".aj-err")
          .remove();
        $(".card-body").prepend(html);
      }
    });
  });

  $("#productList").DataTable({
    aLengthMenu: [
      [5, 10, 25, 50, 100],
      [5, 10, 25, 50, 100]
    ],
    iDisplayLength: 5,
    // processing: true,
    serverSide: true,
    ajax: {
      url: "/product/ajax/list",
      type: "POST"
    },
    columns: [
      { bSortable: false, data: "images" },
      { data: "title" },
      { data: "sizes" },
      { data: "price" },
      { bSortable: false, data: "description" }
    ],
    order: [["1", "asc"]],
    columnDefs: [
      {
        targets: 0,
        data: "images",
        render: function(data, type, row, meta) {
          let html = `
            <img src="../uploads/thumb/${row.images[0]}" />
            `;
          return html;
        }
      },
      {
        targets: 2,
        data: "sizes",
        render: function(data, type, row, meta) {
          let html = `<ul>`;
          row.sizes.map(size => {
            if (size.hasOwnProperty("s")) {
              html += `<li>small : ${size.s}</li>`;
            }
            if (size.hasOwnProperty("m")) {
              html += `<li>medium : ${size.m}</li>`;
            }
            if (size.hasOwnProperty("l")) {
              html += `<li>large : ${size.l}</li>`;
            }
            if (size.hasOwnProperty("xl")) {
              html += `<li>xtra large : ${size.xl}</li>`;
            }
            if (size.hasOwnProperty("xxl")) {
              html += `<li>double xl : ${size.xxl}</li>`;
            }
          });
          html += `</ul>`;
          return html;
        }
      },
      {
        targets: 5,
        data: null,
        render: function(data, type, row, meta) {
          let html = `
            <a href="/product/edit/${row.id}" class="btn btn-success btn-sm margin_bt">Edit</a> <button class="btn btn-danger btn-sm delete_product margin_bt"  data-id="${row.id}" >Delete</button>
            <a href="/order/list/product/${row.id}" class="btn btn-success btn-sm margin_bt">View Orders</a>`;
          return html;
        }
      },
      { orderable: false, searchable: false, targets: -1 }
    ],
    fnDrawCallback: function(oSettings) {
      makeToggle();
    }
  });

  $("#productList").on("click", ".delete_product", function() {
    var evt = $(this);
    var id = $(this).attr("data-id");
    var interviewtable = $("#productList").DataTable();
    $.ajax({
      type: "post",
      url: "/product/delete/" + id,
      success: function(response) {
        interviewtable
          .row(evt.parents("tr"))
          .remove()
          .draw();
      },
      error: function(status) {
        var html = `
        <div class="row mb-3 aj-err">
        <div class="alert alert-danger col-md-12 alert-dismissible fade show" role="alert">
          <strong>Error!</strong> There is something went wrong when perform this action. Please refresh this page and try again.
          <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>
        `;
        $(".card-body")
          .find(".aj-err")
          .remove();
        $(".card-body").prepend(html);
      }
    });
  });

  $("#orderList").DataTable({
    aLengthMenu: [
      [5, 10, 25, 50, 100],
      [5, 10, 25, 50, 100]
    ],
    iDisplayLength: 5,
    // processing: true,
    serverSide: true,
    ajax: {
      url: "/order/ajax/list",
      type: "POST"
    },
    columns: [
      { bSortable: false, data: "productInfo" },
      { data: "productInfo.title" },
      { data: "userInfo" },
      { bSortable: false, data: "size" },
      { bSortable: false, data: "quantity" },
      { bSortable: false, data: "amount" },
      { data: "invoice_id" },
      { data: "invoice_status" },
      { data: "createdAt" }
    ],
    order: [["1", "asc"]],
    columnDefs: [
      {
        targets: 0,
        data: "productInfo",
        render: function(data, type, row, meta) {
          let html = `
            <img src="../uploads/thumb/${row.productInfo.images[0]}" />
            `;
          return html;
        }
      },
      {
        targets: 2,
        data: "userInfo",
        render: function(data, type, row, meta) {
          let html = `${row.userInfo.first_name} ${row.userInfo.last_name}`;
          return html;
        }
      },
      {
        targets: 8,
        data: null,
        render: function(data, type, row, meta) {
          let html = moment(row.createdAt).format("YYYY-MM-DD");
          return html;
        }
      },
      { orderable: false, searchable: false, targets: -1 }
    ],
    fnDrawCallback: function(oSettings) {
      makeToggle();
    }
  });

  $("#user-based-order").DataTable({
    aLengthMenu: [
      [5, 10, 25, 50, 100],
      [5, 10, 25, 50, 100]
    ],
    iDisplayLength: 5,
    // processing: true,
    serverSide: true,
    ajax: {
      url: "/order/ajax/list",
      type: "POST",
      data: {
        user_id: $("#user-based-order").attr("user-id")
      }
    },
    columns: [
      { bSortable: false, data: "productInfo" },
      { data: "productInfo.title" },
      { data: "userInfo" },
      { bSortable: false, data: "size" },
      { bSortable: false, data: "quantity" },
      { bSortable: false, data: "amount" },
      { data: "invoice_id" },
      { data: "invoice_status" },
      { data: "createdAt" }
    ],
    order: [["1", "asc"]],
    columnDefs: [
      {
        targets: 0,
        data: "productInfo",
        render: function(data, type, row, meta) {
          let html = `
            <img src="../../../uploads/thumb/${row.productInfo.images[0]}" />
            `;
          return html;
        }
      },
      {
        targets: 2,
        data: "userInfo",
        render: function(data, type, row, meta) {
          let html = `${row.userInfo.first_name} ${row.userInfo.last_name}`;
          return html;
        }
      },
      {
        targets: 8,
        data: null,
        render: function(data, type, row, meta) {
          let html = moment(row.createdAt).format("YYYY-MM-DD");
          return html;
        }
      },
      { orderable: false, searchable: false, targets: -1 }
    ],
    fnDrawCallback: function(oSettings) {
      makeToggle();
    }
  });

  $("#product-based-order").DataTable({
    aLengthMenu: [
      [5, 10, 25, 50, 100],
      [5, 10, 25, 50, 100]
    ],
    iDisplayLength: 5,
    // processing: true,
    serverSide: true,
    ajax: {
      url: "/order/ajax/list",
      type: "POST",
      data: {
        product_id: $("#product-based-order").attr("product-id")
      }
    },
    columns: [
      { bSortable: false, data: "productInfo" },
      { data: "productInfo.title" },
      { data: "userInfo" },
      { bSortable: false, data: "size" },
      { bSortable: false, data: "quantity" },
      { bSortable: false, data: "amount" },
      { data: "invoice_id" },
      { data: "invoice_status" },
      { data: "createdAt" }
    ],
    order: [["1", "asc"]],
    columnDefs: [
      {
        targets: 0,
        data: "productInfo",
        render: function(data, type, row, meta) {
          let html = `
            <img src="../../../uploads/thumb/${row.productInfo.images[0]}" />
            `;
          return html;
        }
      },
      {
        targets: 2,
        data: "userInfo",
        render: function(data, type, row, meta) {
          let html = `${row.userInfo.first_name} ${row.userInfo.last_name}`;
          return html;
        }
      },
      {
        targets: 8,
        data: null,
        render: function(data, type, row, meta) {
          let html = moment(row.createdAt).format("YYYY-MM-DD");
          return html;
        }
      },
      { orderable: false, searchable: false, targets: -1 }
    ],
    fnDrawCallback: function(oSettings) {
      makeToggle();
    }
  });

  $(".datepicker").datepicker({
    todayHighlight: true,
    autoclose: true,
    format: "yyyy-mm-dd",
    startDate: "+1d"
  });

  $("#event_time").datetimepicker({
    format: "LT"
  });
});

/*============== add images for product========================*/

$(".add_more_images").click(function() {
  const div_length = $(".product_images_files > div").length;
  if (div_length <= 3) {
    $(".product_image:last").after(`<div class="product_image">
    <span class="glyphicon glyphicon-minus remove_more_images float-right"></span>
    <div class="col-4 productonhover"><span>Choose Files </span></div>
    <input class="upload_file" name="product_image" type="file" style="display: none;" aria-describedby="requiredLableBlockForImg" />
    </div>`);

    $("#image_over_msg").hide();
  } else {
    $("#image_over_msg").show();
  }
});
$(".product_images_files").on("click", ".remove_more_images", function() {
  const div_length = $(".product_images_files > div").length;
  if (div_length <= 4) {
    $("#image_over_msg").hide();
  }
  $(this)
    .parent()
    .remove();
});

function readURL(input, selected) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    var new_fileName = input.files[0].name;
    selected
      .closest(".product_image")
      .find(".updated_images_array")
      .val(new_fileName);

    reader.onload = function(e) {
      // selected.closest('.product_image').find('img.profile-img-tag').attr('src', e.target.result);
      selected
        .closest(".product_image")
        .find(".productonhover")
        .html(`<img width="200px" id="selected-img"  height="200px" src=${e.target.result} />`);
    };
    reader.readAsDataURL(input.files[0]);
  }
}
$(".product_images_files").on("change", ".upload_file", function() {
  readURL(this, $(this));
});

$(".product_images_files").on("click", ".productonhover", function() {
  $(this)
    .closest(".product_image")
    .find(".upload_file")
    .trigger("click");
});

/*================= add images and show image===================*/
function read_selectedImage_URL(input, selected) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      selected
        .closest(".imagediv")
        .find(".showonhover")
        .html(`<img width="200px" id="selected-img"  height="200px" src=${e.target.result} />`);
    };
    reader.readAsDataURL(input.files[0]);
  }
}
$(".imagediv").on("change", "#selectfile", function() {
  read_selectedImage_URL(this, $(this));
});

$(document).ready(function(e) {
  $(".showonhover").click(function() {
    $("#selectfile").trigger("click");
  });
});
