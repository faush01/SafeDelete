define(['mainTabsManager'], function (mainTabsManager) {
    'use strict';

    var current_parent_id = "";
    var current_type = "";

    function getTabs() {
        var tabs = [
            {
                href: Dashboard.getConfigurationPageUrl('ItemListPage'),
                name: 'Item List'
            },
            {
                href: Dashboard.getConfigurationPageUrl('SettingsPage'),
                name: 'Settings'
            }
        ];
        return tabs;
    }

    ApiClient.getItemListForDelete = function (url_to_get) {
        console.log("getItemListForDelete Url = " + url_to_get);
        return this.ajax({
            type: "GET",
            url: url_to_get,
            dataType: "json"
        });
    };

    ApiClient.deleteItemConfirmation = function (url_to_get) {
        console.log("deleteItemConfirmation Url = " + url_to_get);
        return this.ajax({
            type: "GET",
            url: url_to_get,
            dataType: "json"
        });
    };

    ApiClient.sendDeleteActionPost = function (url_to_get, query_data) {
        var post_data = JSON.stringify(query_data);
        console.log("sendDeleteActionPost url  = " + url_to_get);
        console.log("sendDeleteActionPost data = " + post_data);
        return this.ajax({
            type: "POST",
            url: url_to_get,
            dataType: "json",
            data: post_data,
            contentType: 'application/json'
        });
    };

    function to_size_text(size_in_bytes) {
        if (size_in_bytes > (1024 * 1024 * 1024)) {
            var gig = (size_in_bytes / (1024 * 1024 * 1024));
            gig = Math.round(gig * 10) / 10;
            return gig + " GB";
        }
        else if (size_in_bytes > (1024 * 1024)) {
            var meg = (size_in_bytes / (1024 * 1024));
            meg = Math.round(meg * 10) / 10;
            return meg + " MB";
        }
        else if (size_in_bytes > 1024) {
            var kilo = (size_in_bytes / 1024);
            kilo = Math.round(kilo * 10) / 10;
            return kilo + " KB";
        }
        else {
            return size_in_bytes + " B";
        }
    }

    function delete_item(view, item_id) {

        var delete_url = "/emby_safe_delete/delete_item/" + item_id + "?stamp=" + new Date().getTime();
        delete_url = ApiClient.getUrl(delete_url);

        ApiClient.deleteItemConfirmation(delete_url).then(function (delete_result) {
            console.log("Delete Result: " + JSON.stringify(delete_result));

            /*
            var confirm_text = "You are about to delete the following files:<br/><br/>";
            confirm_text += "<div style='width:100%;'><table style='margin-left:auto; margin-right:auto;'>";
            for (var index = 0; index < delete_result.file_list.length; index++) {
                confirm_text += "<tr><td style='text-align: left; white-space: nowrap;'>" + delete_result.file_list[index].Key + " </td><td style='text-align: left; white-space: nowrap;'>(" + to_size_text(delete_result.file_list[index].Value) + ")</td></tr>";
            }
            confirm_text += "</table></div><br/>Are you sure?";

            
            require(['dialog'], function (dialog) {
                var buttons = [];

                buttons.push({
                    name: "Yes",
                    id: 'yes',
                    type: 'submit'
                });

                buttons.push({
                    name: "No",
                    id: 'no',
                    type: 'submit'
                });

                dialog({
                    title: "Confirm Delete Action",
                    //text: confirm_text,
                    html: confirm_text,
                    buttons: buttons

                }).then(function (dialog_result) {

                    if (dialog_result === 'yes') {
                        var delete_url_post = "/emby_safe_delete/delete_item_action?stamp=" + new Date().getTime();
                        delete_url_post = ApiClient.getUrl(delete_url_post);

                        var query_data = {
                            action_token: delete_result.action_token,
                            item_id: item_id
                        };

                        ApiClient.sendDeleteActionPost(delete_url_post, query_data).then(function (result) {

                            alert("Delete action\r\nResult: " + result.result + "\r\n" + result.message);

                        });
                    }

                });
            });
            */


            var confirm_text = "You are about to delete the following files:\r\n\r\n";
            for (var index = 0; index < delete_result.file_list.length; index++) {
                confirm_text += " - " + delete_result.file_list[index].Key + " (" + to_size_text(delete_result.file_list[index].Value) + ")\r\n";
            }
            confirm_text += "\r\nAre you sure?\r\n\r\n";

            var conf = confirm(confirm_text);

            if (conf) {

                var delete_url_post = "/emby_safe_delete/delete_item_action?stamp=" + new Date().getTime();
                delete_url_post = ApiClient.getUrl(delete_url_post);

                var query_data = {
                    action_token: delete_result.action_token,
                    item_id: item_id
                };

                ApiClient.sendDeleteActionPost(delete_url_post, query_data).then(function (result) {
                    if (result.result) {
                        alert("Item files processed");
                    }
                    else {
                        alert("Error processing files!\r\n\r\n" + result.message);
                    }
                });
            }

        });
    }

    function show_items(view, type, parent) {

        if (parent !== null) {
            current_parent_id = parent;
        }
        if (type !== null) {
            current_type = type;
        }

        if (!current_type) {
            return;
        }

        var sort_by_selection = view.querySelector('#sort_by_selection');
        var sort_action = sort_by_selection.options[sort_by_selection.selectedIndex].value;

        var url_to_get = "/emby_safe_delete/list_items?parent_id=" + current_parent_id + "&item_type=" + current_type + "&sort_by=" + sort_action + "&stamp=" + new Date().getTime();
        url_to_get = ApiClient.getUrl(url_to_get);

        ApiClient.getItemListForDelete(url_to_get).then(function (items_list_data) {
            //alert("Loaded Data: " + JSON.stringify(usage_data));
            populate_items_listreport(view, items_list_data);
        });
    }

    function populate_items_listreport(view, item_list_data) {

        console.log(JSON.stringify(item_list_data));

        var table_body = view.querySelector('#item_list_rows');

        while (table_body.firstChild) {
            table_body.removeChild(table_body.firstChild);
        }

        item_list_data.forEach(function (item_details, index) {

            var tr = document.createElement("tr");
            tr.className = "detailTableBodyRow detailTableBodyRow-shaded";

            var td = document.createElement("td");
            td.style = "white-space: nowrap;width: 100%";
            var span = document.createElement("span");
            span.style = "font-size: large; font-weight: bold;";
            var item_name = "NONE";

            if (item_details.type === "Series") {
                item_name = item_details.name;
                span.style.cursor = "pointer";
                span.addEventListener("click", function () { show_items(view, "Season", item_details.id); });
            }
            else if (item_details.type === "Season") {
                item_name = item_details.series_name + " - " + item_details.name;
                span.style.cursor = "pointer";
                span.addEventListener("click", function () { show_items(view, "Episode", item_details.id); });
            }
            else if (item_details.type === "Episode") {
                item_name = item_details.series_name + " - " + item_details.season_name + " - " + item_details.episode_number + " : " + item_details.name;
            }
            else if (item_details.type === "Movie") {
                item_name = item_details.name + " (" + item_details.production_year + ")";
            }

            // item_name += " (" + item_details.played_date + ")";

            span.innerHTML = item_name;
            td.appendChild(span);
            tr.appendChild(td);

            td = document.createElement("td");
            td.style = "text-align: center;";
            if (item_details.played) {
                span = document.createElement("span");
                var i_played = document.createElement("i");
                i_played.style = "font-size: x-large;";
                i_played.className = "md-icon";
                var t_played = document.createTextNode("check_circle");
                i_played.appendChild(t_played);
                span.appendChild(i_played);
                td.appendChild(span);
            }
            tr.appendChild(td);

            td = document.createElement("td");
            td.style = "text-align: center;";
            span = document.createElement("span");
            var i = document.createElement("i");
            i.className = "md-icon";
            i.style = "font-size: x-large;cursor: pointer;";
            var t = document.createTextNode("delete");
            i.appendChild(t);
            span.appendChild(i);
            span.setAttribute("title", "Delete");
            span.addEventListener("click", function () { delete_item(view, item_details.id); });
            td.appendChild(span);
            tr.appendChild(td);

            table_body.appendChild(tr);

        });
    }

    function add_starting_rows(view) {

        var table_body = view.querySelector('#item_list_rows');

        while (table_body.firstChild) {
            table_body.removeChild(table_body.firstChild);
        }

        // add movies root item
        var tr = document.createElement("tr");
        tr.className = "detailTableBodyRow detailTableBodyRow-shaded";

        var td = document.createElement("td");
        var span = document.createElement("span");
        span.style = "font-size: large; font-weight: bold;";
        span.innerHTML = "Movies";
        span.style.cursor = "pointer";
        span.addEventListener("click", function () { show_items(view, "Movie", ""); });
        td.appendChild(span);
        tr.appendChild(td);

        td = document.createElement("td");
        td.appendChild(document.createTextNode(""));
        tr.appendChild(td);

        td = document.createElement("td");
        td.appendChild(document.createTextNode(""));
        tr.appendChild(td);

        table_body.appendChild(tr);

        // add TV Shows root item
        tr = document.createElement("tr");
        tr.className = "detailTableBodyRow detailTableBodyRow-shaded";

        td = document.createElement("td");
        span = document.createElement("span");
        span.style = "font-size: large; font-weight: bold;";
        span.innerHTML = "TV Shows";
        span.style.cursor = "pointer";
        span.addEventListener("click", function () { show_items(view, "Series", ""); });
        td.appendChild(span);
        tr.appendChild(td);

        td = document.createElement("td");
        td.appendChild(document.createTextNode(""));
        tr.appendChild(td);

        td = document.createElement("td");
        td.appendChild(document.createTextNode(""));
        tr.appendChild(td);

        table_body.appendChild(tr);

    }

    // /emby_safe_delete/list_items?item_type=Movie
    // /emby_safe_delete/list_items?item_type=Series
    // /emby_safe_delete/list_items?parent_id=6&item_type=Season
    // /emby_safe_delete/list_items?parent_id=7&item_type=Episode

    return function (view, params) {

        view.addEventListener('viewshow', function (e) {
            mainTabsManager.setTabs(this, 0, getTabs);

            var sort_by_selection = view.querySelector('#sort_by_selection');
            sort_by_selection.addEventListener("change", sort_changed);
            
            function sort_changed() {
                show_items(view, null, null);
            }

            add_starting_rows(view);
        });

        view.addEventListener('viewhide', function (e) {

        });

        view.addEventListener('viewdestroy', function (e) {

        });

    };
    
});
