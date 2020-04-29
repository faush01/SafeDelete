define(['mainTabsManager'], function (mainTabsManager) {
    'use strict';

    function getTabs() {
        var tabs = [
            {
                href: Dashboard.getConfigurationPageUrl('ItemListPage'),
                name: 'Safe Delete'
            },
            {
                href: Dashboard.getConfigurationPageUrl('ActivityListPage'),
                name: 'Activity'
            },
            {
                href: Dashboard.getConfigurationPageUrl('SettingsPage'),
                name: 'Settings'
            }
        ];
        return tabs;
    }

    ApiClient.getSafeDeleteActivity = function (url_to_get) {
        console.log("getSafeDeleteActivity Url = " + url_to_get);
        return this.ajax({
            type: "GET",
            url: url_to_get,
            dataType: "json"
        });
    };

    function process_results(view, activity_data) {

        console.log("activity_data:" + JSON.stringify(activity_data));

        var table_body = view.querySelector('#activity_list_rows');

        while (table_body.firstChild) {
            table_body.removeChild(table_body.firstChild);
        }

        activity_data.forEach(function (item_details, index) {

            var tr = document.createElement("tr");
            tr.className = "detailTableBodyRow detailTableBodyRow-shaded";

            var td = null;
            var span = null;

            // status
            td = document.createElement("td");
            td.style = "white-space: nowrap;";
            span = document.createElement("span");
            var status_text = "Finished";
            if (item_details.status) {
                status_text = "Runnnig";
            }
            span.innerHTML = status_text;
            td.appendChild(span);
            tr.appendChild(td);

            // result
            td = document.createElement("td");
            td.style = "white-space: nowrap;";
            span = document.createElement("span");
            var result_text = "";
            if (item_details.result && !item_details.status) {
                result_text = "Succeeded";
            }
            else if (!item_details.status) {
                result_text = "Failed";
            }
            span.innerHTML = result_text;
            td.appendChild(span);
            tr.appendChild(td);

            // messages
            td = document.createElement("td");
            td.style = "white-space: nowrap;";
            span = document.createElement("span");

            var messages = "";
            for (var x = 0; x < item_details.messages.length; x++) {
                messages += item_details.messages[x] + "<br/>";
            }

            span.innerHTML = messages;
            span.setAttribute("title", "messages");
            td.appendChild(span);
            tr.appendChild(td);

            table_body.appendChild(tr);

        });

    }

    return function (view, params) {

        view.addEventListener('viewshow', function (e) {
            mainTabsManager.setTabs(this, 1, getTabs);

            var url_to_get = "/emby_safe_delete/delete_activity?stamp=" + new Date().getTime();
            url_to_get = ApiClient.getUrl(url_to_get);

            ApiClient.getSafeDeleteActivity(url_to_get).then(function (activity_data) {
                process_results(view, activity_data);
            });

        });

        view.addEventListener('viewhide', function (e) {

        });

        view.addEventListener('viewdestroy', function (e) {

        });

    };

});
