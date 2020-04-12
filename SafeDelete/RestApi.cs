using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Entities.Movies;
using MediaBrowser.Controller.Entities.TV;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Net;
using MediaBrowser.Controller.Security;
using MediaBrowser.Controller.Session;
using MediaBrowser.Model.IO;
using MediaBrowser.Model.Logging;
using MediaBrowser.Model.Services;
using System;
using System.Collections.Generic;
using System.Text;
using System.Security.Cryptography;
using MediaBrowser.Model.Entities;

namespace SafeDelete
{
    [Route("/emby_safe_delete/delete_item_action", "POST", Summary = "Safe delete an item action")]
    [Authenticated]
    public class SafeDeleteAction : IReturn<Object>
    {
        public string item_id { get; set; }

        public string action_token { get; set; }
    }

    [Route("/emby_safe_delete/delete_item/{item_id}", "GET", Summary = "Safe delete an item")]
    [Authenticated]
    public class SafeDelete : IReturn<Object>
    {
        [ApiMember(Name = "item_id", Description = "The item ID", IsRequired = true, DataType = "string", ParameterType = "path", Verb = "GET")]
        public string item_id { get; set; }
    }

    [Route("/emby_safe_delete/list_items", "GET", Summary = "List items")]
    [Authenticated]
    public class ListItems : IReturn<Object>
    {
        [ApiMember(Name = "parent_id", Description = "The parent of the items", IsRequired = false, DataType = "string", ParameterType = "query", Verb = "GET")]
        public string parent_id { get; set; }

        [ApiMember(Name = "item_type", Description = "The type of the items you want", IsRequired = false, DataType = "string", ParameterType = "query", Verb = "GET")]
        public string item_type { get; set; }

        [ApiMember(Name = "sort_by", Description = "Sort items by", IsRequired = false, DataType = "string", ParameterType = "query", Verb = "GET")]
        public string sort_by { get; set; }
    }


    class RestApi : IService, IRequiresRequest
    {
        private readonly ILogger _logger;
        private readonly IUserManager _userManager;
        private readonly IAuthorizationContext _ac;
        private readonly ILibraryManager _lm;
        private readonly IFileSystem _fs;

        public RestApi(ILogManager logger, 
                       IUserManager userManager, 
                       IAuthorizationContext authContext,
                       ILibraryManager libraryManager,
                       IFileSystem fs)
        {
            _logger = logger.GetLogger("SafeDelete");
            _userManager = userManager;
            _ac = authContext;
            _lm = libraryManager;
            _fs = fs;
        }

        public IRequest Request { get; set; }

        private string GetItemRecyclePath(BaseItem item)
        {

            return "";
        }

        public object Post(SafeDeleteAction request)
        {
            _logger.Info("POST SafeDeleteAction: {0}", request);

            long item_id = long.Parse(request.item_id);
            BaseItem item = _lm.GetItemById(item_id);

            List<FileSystemMetadata> del_paths = item.GetDeletePaths(false);
            PathWalker walker = new PathWalker(del_paths, _fs);

            List<KeyValuePair<string, long>> file_list = walker.GetFileNames();
            Dictionary<string, int> ext_counts = walker.GetExtCounts();

            // verify action token
            string file_info_string = "";
            string file_list_hash = "";
            foreach (var file_item in file_list)
            {
                file_info_string += file_item.Key + "|" + file_item.Value + "|";
            }
            using (MD5 md5Hash = MD5.Create())
            {
                byte[] hashBytes = md5Hash.ComputeHash(Encoding.UTF8.GetBytes(file_info_string));
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < hashBytes.Length; i++)
                {
                    sb.Append(hashBytes[i].ToString("X2"));
                }
                file_list_hash = sb.ToString();
            }

            Dictionary<string, object> result = new Dictionary<string, object>();

            if (file_list_hash != request.action_token)
            {
                result.Add("result", false);
                result.Add("message", "The action tokens to not match.");
                return result;
            }

            // do file move
            string recycle_path = Plugin.Instance.Configuration.RecycledPath;
            if (string.IsNullOrEmpty(recycle_path))
            {
                result.Add("result", false);
                result.Add("message", "Recycle path not set.");
                return result;
            }

            if (!_fs.DirectoryExists(recycle_path))
            {
                result.Add("result", false);
                result.Add("message", "Recycle path does not exist.");
                return result;
            }

            // do file moves
            string time_stamp = DateTime.Now.ToString("yyyy-MM-dd-HH-mm-ss-fff");
            int item_number = 0;

            bool action_result = true;
            string action_message = "Files moved.";

            foreach (var del_item in del_paths)
            {
                _logger.Info("Item Delete Path: " + del_item.FullName);

                if (del_item.IsDirectory)
                {
                    FileSystemMetadata fsm = _fs.GetDirectoryInfo(del_item.FullName);
                    string destination = System.IO.Path.Combine(recycle_path, time_stamp, item_number.ToString());
                    _logger.Info("Item Delete Destination Path: " + destination);

                    try
                    {
                        _fs.CreateDirectory(destination);
                        destination = System.IO.Path.Combine(destination, fsm.Name);
                        _fs.MoveDirectory(del_item.FullName, destination);
                    }
                    catch(Exception e)
                    {
                        action_result = false;
                        action_message = e.Message;
                    }
                }
                else
                {
                    FileSystemMetadata fsm = _fs.GetDirectoryInfo(del_item.FullName);
                    string destination = System.IO.Path.Combine(recycle_path, time_stamp, item_number.ToString());
                    _logger.Info("Item Delete Destination Path: " + destination);

                    try
                    {
                        _fs.CreateDirectory(destination);
                        destination = System.IO.Path.Combine(destination, fsm.Name);
                        _fs.MoveFile(del_item.FullName, destination);
                    }
                    catch(Exception e)
                    {
                        action_result = false;
                        action_message = e.Message;
                    }
                }

                if (!action_result)
                {
                    break;
                }

                item_number++;
            }

            result.Add("result", action_result);
            result.Add("message", action_message);

            return result;
        }

        public object Get(SafeDelete request)
        {
            _logger.Info("GET SafeDelete: {0}", request);

            long item_id = long.Parse(request.item_id);
            BaseItem item = _lm.GetItemById(item_id);

            List<FileSystemMetadata> del_paths = item.GetDeletePaths(false);
            foreach (var del_item in del_paths)
            {
                _logger.Info("Item Delete Path: " + del_item.FullName);
            }

            PathWalker walker = new PathWalker(del_paths, _fs);

            foreach (var path_item in walker.GetFileList())
            {
                _logger.Info("Item Delete Walked Path: " + path_item.FullName);
            }

            List<KeyValuePair<string, long>> file_list = walker.GetFileNames();
            Dictionary<string, int> ext_counts = walker.GetExtCounts();

            // calculate delete token based on files and sizes
            string file_info_string = "";
            string file_list_hash = "";
            foreach (var file_item in file_list)
            {
                file_info_string += file_item.Key + "|" + file_item.Value + "|";
            }
            using (MD5 md5Hash = MD5.Create())
            {
                byte[] hashBytes = md5Hash.ComputeHash(Encoding.UTF8.GetBytes(file_info_string));
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < hashBytes.Length; i++)
                {
                    sb.Append(hashBytes[i].ToString("X2"));
                }
                file_list_hash = sb.ToString();
            }

            Dictionary<string, object> results = new Dictionary<string, object>();
            results.Add("file_list", file_list);
            results.Add("ext_counts", ext_counts);
            results.Add("action_token", file_list_hash);

            foreach (var file_item in file_list)
            {
                _logger.Info("Item Delete Walked Files: " + file_item.Key + " - " + file_item.Value);
            }

            foreach (KeyValuePair<string, int> ext_count in ext_counts)
            {
                _logger.Info("Item Delete Walked Ext: " + ext_count.Key + " - " + ext_count.Value);
            }

            return results;
        }


        public object Get(ListItems request)
        {
            //Plugin.Instance.Configuration.RecycledPath = @"C:\Temp\EmbyRecycled";
            //Plugin.Instance.SaveConfiguration();

            string parent_id = request.parent_id;
            string item_type = request.item_type;
            _logger.Info("parent_id : " + parent_id);
            _logger.Info("item_type : " + item_type);

            AuthorizationInfo user = _ac.GetAuthorizationInfo(Request);
            string username = user.User.Name;

            InternalItemsQuery query = new InternalItemsQuery();
            query.IncludeItemTypes = new string[] { item_type };
            query.Recursive = false;
            query.User = user.User;
            query.IsVirtualItem = false;

            if (!string.IsNullOrEmpty(parent_id))
            {
                long long_id = long.Parse(parent_id);
                query.ParentIds = new long[] { long_id };
            }

            if (request.sort_by == "date_watched")
            {
                var sort = new (string, SortOrder)[1] { ("DatePlayed", SortOrder.Descending) };
                query.OrderBy = sort;
            }
            else if (request.sort_by == "date_added")
            {
                var sort = new (string, SortOrder)[1] { ("DateCreated", SortOrder.Descending) };
                query.OrderBy = sort;
            }
            else if (request.sort_by == "name")
            {
                var sort = new (string, SortOrder)[1] { ("Name", SortOrder.Ascending) };
                query.OrderBy = sort;
            }

            List<Dictionary<string, object>> item_list = new List<Dictionary<string, object>>();
            var results = _lm.GetItemList(query);
            foreach (var item in results)
            {
                //Movie movie_item  = item as Movie;

                Dictionary<string, object> item_info = new Dictionary<string, object>();
                item_info["id"] = item.InternalId;
                item_info["type"] = item.GetType().Name;
                item_info["name"] = item.Name;
                item_info["played"] = item.IsPlayed(user.User);
                item_info["played_date"] = item.LastPlayedDate;
                item_info["created_date"] = item.DateCreated;

                if (typeof(Episode).Equals(item.GetType()))
                {
                    Episode epp = item as Episode;
                    item_info["series_name"] = epp.SeriesName;
                    item_info["season_name"] = epp.Season.Name;
                    item_info["season_number"] = epp.Season.IndexNumber;
                    item_info["episode_number"] = epp.IndexNumber;
                }
                else if (typeof(Season).Equals(item.GetType()))
                {
                    Season season = item as Season;
                    item_info["series_name"] = season.SeriesName;
                    item_info["season_number"] = season.IndexNumber;
                }
                else if (typeof(Movie).Equals(item.GetType()))
                {
                    Movie movie = item as Movie;
                    item_info["production_year"] = movie.ProductionYear;
                }

                item_list.Add(item_info);
            }

            return item_list;
        }


    }
}
