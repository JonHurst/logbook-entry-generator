"use strict";

function processFreeform() {
    $("#error").addClass("hidden").empty();
    $("body").addClass("wait");
    $.ajax({
        type: "POST",
        url: "https://em2vhcx7x3.execute-api.us-east-1.amazonaws.com/prod/freeform",
        contentType: "application/json",
        crossDomain: true,
        datatype: 'json',
        data: JSON.stringify({'action': 'csvlogbook', 'data': $("#freeform").val()}),
        timeout: 10000,
        success: displayData,
        error: freeform_error});
}


function fileChosen(evt) {
    $("#error").addClass("hidden").empty();
    evt.stopPropagation();
    evt.preventDefault();
    $("#freeform").val("Please wait...").addClass("wait");
    var fileref = this.files[0];
    var reader = new FileReader();
    reader.onload = fileRead;
    reader.readAsText(fileref);
}


function fileRead(evt) {
    $("#sectors").addClass("hidden");
    $("#duties").addClass("hidden");
    $("#crew").addClass("hidden");
    $("#error").addClass("hidden").empty();
    $("#freeform").val(evt.target.result).removeClass("wait");
}


function spacepadNumber(number, length) {
    var num_string = number.toString();
    while(num_string.length < length) {
        num_string = " " + num_string;
    }
    return num_string;
}


function sectorsFragment(sectors) {
    if(sectors.length == 0) return null;
    var text = "";
    for(var c = 0; c < sectors.length; c++) {
        var s = sectors[c];
        text += s.Start + ", " +
                spacepadNumber(s.Duration, 3) + ", " +
                spacepadNumber(s.NightDuration, 3) + ", \"" +
                s.From + "\", \""
                + s.To + "\", \"" +
                s.Registration + "\", \"" +
                s.Type + "\", \"" +
                s.Captain + "\", \"" +
                s.Role + "\"&#10;";
    }
    return text;
}


function dutiesFragment(duties) {
    if(duties.length == 0) return null;
    var text = "";
    for(var c = 0; c < duties.length; c++) {
        var d = duties[c];
        text += d.Start + ", " +
            spacepadNumber(d.Duration, 3) + "&#10;";
    }
    return text;
}


function crewFragment(sectors) {
    var crew_found = false;
    var text = "";
    for(var c = 0; c < sectors.length; c++) {
        var s = sectors[c];
        if(s.Crew.length == 0) continue;
        crew_found = true;
        text += s.Start + ", ";
        for(var cc = 0; cc < s.Crew.length; cc++) {
            //need to remove any " as we're outputting csv
            text += "\"" +
                s.Crew[cc][0].replace(/"/g, "") +
                ":" +
                s.Crew[cc][1].replace(/"/g, "") +
                "\", ";
        }
        text = text.slice(0, -2) + "&#10;";
    }
    return text;
}


function textarea(str) {
    return "<button class='clipboard' type='button' " +
        "onclick='copy_to_clipboard(this)'>" +
        "Copy to clipboard</button>" +
        "<textarea readonly='readonly' rows='10'>" +
        str + "</textarea>";
}


function copy_to_clipboard(o) {
    var text = o.nextElementSibling.textContent;
    navigator.clipboard.writeText(text);
}


function displayData(data) {
    $("body").removeClass("wait");
    $("#sectors").addClass("hidden").empty();
    $("#duties").addClass("hidden").empty();
    $("#crew").addClass("hidden").empty();
    $("#error").addClass("hidden").empty();
    if(data.errorType == "ValidationError") {
        $("#error")
            .append("<h1>Validation Error</h1>")
            .append($("<p/>").text(data.errorMessage))
            .removeClass("hidden");
    }
    else {
        data = JSON.parse(data);
        var sector_frag = sectorsFragment(data.sectors);
        if(sector_frag) $("#sectors")
            .append($("<h1>Sectors</h1>"))
            .append($(textarea(sector_frag)))
            .removeClass("hidden");
        var duties_frag = dutiesFragment(data.duties);
        if (duties_frag) $("#duties")
            .append($("<h1>Duties</h1>"))
            .append($(textarea(duties_frag)))
            .removeClass("hidden");
        var crew_frag = crewFragment(data.sectors);
        if (crew_frag) $("#crew")
            .append($("<h1>Crew</h1>"))
            .append($(textarea(crew_frag)))
            .removeClass("hidden");
    }
    if(!navigator.clipboard) {
        $("button.clipboard").addClass("hidden");
    }
}


function freeform_error(jqxhr, status, string) {
    $("body").removeClass("wait");
    $("#sectors").addClass("hidden").empty();
    $("#duties").addClass("hidden").empty();
    $("#crew").addClass("hidden").empty();
    var err_msg = $("<dl/>")
            .append($("<dt/>").text("Status: " + status))
            .append($("<dd/>").text("Error: " + string));
    $("#error").removeClass("hidden")
        .append($("<p>A server error occurred during form processing.</p>"))
        .append(err_msg);
}


$(document).ready(function() {
    //clearing val on click event allows change event to fire
    //for same file selected
    $("#uploadme").on("click", function() {$(this).val("");});
    $("#uploadme").on("change", fileChosen);
    $("#runme").on("click", processFreeform);
});
