var h,w;
var WindowsSize=function(){
    h=$(window).height();
    w=$(window).width();
};
function SearchBox_show(){
    $(".left-content").animate({
        opacity: 'hide',
    });
    $(".right-content").animate({
        opacity: 'hide',
    });
    $(".center-content").animate({
        width: '100%',
        opacity: '100',
    });
    $("#search-box").animate({
        width: '90%',
        opacity: '100',
    });
    $("#back").show();
}

function SearchBox_hide(){
    //hide
    $(".left-content, .right-content").stop().show("fade");
    $(".center-content, #search-box").css({width: '', opacity: ''});
    $("#back").hide();

}

$(document).ready(function(){
    WindowsSize();
    $("#back").hide();
    $("#back").click(function(){
        SearchBox_hide();
    });

    //$("#search-button").click(function(){
     document.querySelector('#search-button').addEventListener('click', function () {
        if($("#search-box").val()==""){
            if(w < 768) SearchBox_show();
        }else{
            //alert("search");
            $.ajax({
               type: 'POST',
                data: { search: document.querySelector('#search-box').value.toString() },
                url:  '/search',
                success: function(result) {
                    if(result != "") {
                        document.open();
                        document.write(result);
                        document.close();
                        console.log("a");
                    }
                },
                error: function(error) {
                    console.log(error);
                }
            });
        }
     });
        //var search = $('#search-box').val();
         /*
         $.post("/search",
            {
              search: document.querySelector('#search-box').value.toString()
            },
            function(data,status){
              alert("Data: " + data + "\nStatus: " + status);
            }
         );
         */

    $("#sidebar").hide();
    $("#side_menu").click(function(){
        $("#sidebar").toggle();
        if(w > 1200){
            $("#content").show();
        }else{
            $("#content").toggle();
        }		
    });

    /*
    const content = document.querySelector("#content");
    const sidebar = document.querySelector("#sidebar");
    const toggleButton = document.querySelector("#side_menu");

    function handleResize() {
      if (window.innerWidth <= 1200) {
        content.style.display = "none";
        sidebar.style.width = "100%";
      } else {
        content.style.display = "block";
        sidebar.style.width = "30%";
      }
    }
    window.addEventListener("resize", handleResize);
    */
// });
$(window).resize(WindowsSize); 