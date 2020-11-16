var listCounter = 0;
function createTask(str){
  var $input = $("#newTaskText");
  if(str==""||str==null)
  {
    alert("Please enter a task");
  }
  else{
  $("#insertionPoint").before(`
  <!-- task you have claimed and not finished -->
  <div class = "new-task">
    
      <input type="hidden" id="taskId" name="taskId" value="my_unfin">
      <div class="input-group mb-3">
          <div class="input-group-prepend">
              <div class="input-group-text">
                  <input type="checkbox" id="check${listCounter}" name="checked" onchange="check()">
              </div>
          </div>
          <input type="text" class="form-control" disabled="true" id="text${listCounter}" placeholder="${str}">
      </div>
  </div>
  `)
  $("#insertionPoint").prev().hide().fadeIn();
  $input.val("");
}
}

function check()
{
  for (let i =0; i<listCounter; i++)
  {
    if($("#check" + i).is(":checked"))
    {
          $("#text" + i).addClass("done");
    }
    else
    {
      $("#text" + i).removeClass("done");
    }
  }
}

function removeComplete(){
  for(let i =0; i<listCounter; i++){
    if($("#check" + i).is(":checked")){
      $("#check" + i).parent().parent().parent().parent().fadeOut();
    }
  }
}
$(document).ready(function(){
  $("#remove").on("click", function(){
    removeComplete();
  })
  $("#newTaskSubmit").on("click", function(){
    createTask($("#newTaskText").val());
    listCounter++;
  })
})


