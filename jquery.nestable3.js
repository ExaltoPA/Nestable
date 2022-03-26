/*jslint browser: true, devel: true, white: true, eqeq: true, plusplus: true, sloppy: true, vars: true*/
/*global $ */

/****************** <<< WIP, to be re-ordered and re-organized!!! *****************/

function escapeDoublequotes(text){
  return text.replace(/"/g, '&quot;');
}

function unescapeDoublequotes(text){
  return text.replace(/&quot;/g, '"');
}

function export_menu(output_json_content) {
	//Set content as url
	const url = window.URL.createObjectURL(new Blob([output_json_content], {type: 'text/plain;charset=UTF-8;'}));
	
	//this trick will generate a temp <a /> tag
	const linkField = document.createElement('a');
  let filename = "export";
	linkField.setAttribute('href', url);
	linkField.setAttribute('download', filename + ".json");
	
	//set the visibility hidden so it will not effect on your web-layout
	linkField.style.display = 'none';
	
	//this part will append the anchor tag and remove it after automatic click
	document.body.appendChild(linkField);
	linkField.click();
	document.body.removeChild(linkField);
}

function load_nestable_menu(options){
  var defaults = {
      rebuild: true,
      rebuildCallback: function(){updateJsonOutput();updateBtnEvents();},
      maxDepth: 15,
  };
  var settings = $.extend({}, defaults, options);

  $('.dd.nestable').nestable(settings)
    .off('change')              
    .on('change', updateOutput);  // Updates JSON output after drag and drop
}

var sample_json_input  = '[{"name":"Item 1","id":1},{"name":"Item 2","id":2},{"name":"Item 3","id":3,"children":[{"name":"Item 4","id":4},{"name":"Item 5","id":5}]}]';
$('#nestable-menu').on('click', function(e){
  var target = $(e.target),
      action = target.data('action');
  if (action === 'expand-all') {
      $('.dd').nestable('expandAll');
  }
  if (action === 'collapse-all') {
      $('.dd').nestable('collapseAll');
  }
  if (action === 'sample') {
      menuEditor.fadeOut();
      load_nestable_menu({json: sample_json_input});
  }
  if (action === 'load-menu-file') {
      menuEditor.fadeOut();
      $('#inputfile').click();
  }
  if (action === 'save-menu-file') {
      export_menu($('#json-output').val());
  }
});

$('#inputfile').on('change', function() {
    var fr=new FileReader();
    fr.onload=function(){
        load_nestable_menu({json: fr.result});
        $('.dd').nestable('collapseAll');
    }
    if (this.files[0]){
      fr.readAsText(this.files[0], 'UTF-8');
    }else{
      console.log("Nessun file selezionato");
    }
})

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function updateJsonOutput(){
  // Update JSON output
  updateOutput($('.dd.nestable').data('output', $('#json-output')));
}

function updateBtnEvents(){
  // Set or reset click events
  $(".dd.nestable .button-delete").off("click").on("click", deleteFromMenu);
  $(".dd.nestable .button-edit").off("click").on("click", prepareEdit);
}

// Auto scrolling div. Source: https://stackoverflow.com/questions/8987519/always-visible-div-while-scrolling
$().ready(function() {
  var autoScrollingDiv = $("#autoScrollingDiv");

  $(window).scroll(function(){            
    autoScrollingDiv
          .stop()
          .animate({"marginTop": ($(window).scrollTop() )}, "slow" );         
  });
});

/*************** General ***************/

var updateOutput = function (e) {
  var list = e.length ? e : $(e.target),
      output = list.data('output');
  if (window.JSON) {
    if (output) {
      output.val(window.JSON.stringify(list.nestable('serialize')));
    }
  } else {
    alert('JSON browser support required for this page.');
  }
};

var nestableList = $(".dd.nestable > .dd-list");

/***************************************/


/*************** Delete ***************/

var deleteFromMenuHelper = function (target) {
  // Hide the edit form if deleting the item under edit
  if (target.data('id') == $('#editButton').data('owner-id')){
    menuEditor.fadeOut();
  }

  target.fadeOut(function () {
    target.remove();
    updateJsonOutput();
  });
};

var deleteFromMenu = function () {
  var targetId = $(this).data('owner-id');
  var target = $('[data-id="' + targetId + '"]');

  var result = confirm("Delete " + target.data('name') + " and all its subitems ?");
  if (!result) {
    return;
  }

  // Remove children (if any)
  target.find("li").each(function () {
    deleteFromMenuHelper($(this));
  });

  // Remove parent
  deleteFromMenuHelper(target);

  // Update JSON output
  updateJsonOutput();

  // Set or reset click events
  updateBtnEvents();
};

/***************************************/


/*************** Edit ***************/

var menuEditor = $("#menu-editor");
var editButton = $("#editButton");
var editInputName = $("#editInputName");
var currentEditName = $("#currentEditName");

// Prepares and shows the Edit Form
var prepareEdit = function () {
  var targetId = $(this).data('owner-id');
  var target = $('[data-id="' + targetId + '"]');

  editInputName.val(unescapeDoublequotes(target.data("name")));
  currentEditName.html(target.data("name"));
  editButton.data("owner-id", target.data("id"));

  console.log("[INFO] Editing Menu Item " + editButton.data("owner-id"));

  menuEditor.fadeIn();
};

// Saves the edit in the Menu item and hides the Edit Form
var editMenuItem = function () {
  var targetId = $(this).data('owner-id');
  var target = $('[data-id="' + targetId + '"]');

  var newName = escapeDoublequotes(editInputName.val());

  target.data("name", newName);

  target.find("> .dd-handle").html(newName);

  menuEditor.fadeOut();

  // Update JSON output
  updateJsonOutput();

  // Set or reset click events
  updateBtnEvents();
};

/***************************************/


/*************** Add ***************/

var addToMenu = function () {
  var newName = escapeDoublequotes($("#addInputName").val());
  var newId = 'new-' + Math.floor(Date.now() / 1000) + getRndInteger(100, 999);

  nestableList_domObj = $(nestableList.selector);
  nestableList_domObj.append(
    '<li class="dd-item" ' +
    'data-id="' + newId + '" ' +
    'data-name="' + newName + '">' +
    '<div class="dd-handle">' + newName + '</div> ' +
    '<span class="button-delete btn btn-default btn-xs pull-right" ' +
    'data-owner-id="' + newId + '"> ' +
    '<i class="fa fa-times-circle-o" aria-hidden="true"></i> ' +
    '</span>' +
    '<span class="button-edit btn btn-default btn-xs pull-right" ' +
    'data-owner-id="' + newId + '">' +
    '<i class="fa fa-pencil" aria-hidden="true"></i>' +
    '</span>' +
    '</li>'
  );

  // Update JSON output
  updateJsonOutput();

  // Set or reset click events
  updateBtnEvents();
};



/***************************************/



$(function () {
  // output initial serialised data
  updateJsonOutput();

  // set onclick events
  editButton.on("click", editMenuItem);
  updateBtnEvents();

  $("#menu-editor").submit(function (e) {
    e.preventDefault();
  });

  $("#menu-add").submit(function (e) {
    e.preventDefault();
    addToMenu();
  });

});

