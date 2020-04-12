using MediaBrowser.Model.IO;
using System;
using System.Collections.Generic;
using System.Text;

namespace SafeDelete
{
    class PathWalker
    {
        private readonly IFileSystem _fs;
        private List<FileSystemMetadata> file_full_list = new List<FileSystemMetadata>();
        private List<FileSystemMetadata> delete_paths = null;

        public PathWalker(List<FileSystemMetadata> del_paths, IFileSystem fs)
        {
            _fs = fs;
            delete_paths = del_paths;

            foreach (var del_item in del_paths)
            {
                if (del_item.IsDirectory)
                {
                    FileSystemMetadata fsm = fs.GetDirectoryInfo(del_item.FullName);
                    WalkPath(fsm);
                }
                else
                {
                    FileSystemMetadata fsm = fs.GetFileInfo(del_item.FullName);
                    file_full_list.Add(fsm);
                }
            }
        }

        private void WalkPath(FileSystemMetadata fsm)
        {
            file_full_list.Add(fsm);
            foreach (var file in _fs.GetFiles(fsm.FullName))
            {
                if (file.IsDirectory)
                {
                    WalkPath(file);
                }
                else
                {
                    file_full_list.Add(file);
                }
            }

            foreach (var file in _fs.GetDirectories(fsm.FullName))
            {
                if (file.IsDirectory)
                {
                    WalkPath(file);
                }
                else
                {
                    file_full_list.Add(file);
                }
            }
        }

        public List<FileSystemMetadata> GetFileList()
        {
            return file_full_list;
        }

        public List<KeyValuePair<string, long>> GetFileNames()
        {
            List<KeyValuePair<string, long>> file_names = new List<KeyValuePair<string, long>>();

            foreach(var file in file_full_list)
            {
                if (!file.IsDirectory)
                {
                    string file_name = file.FullName;
                    bool found = false;
                    foreach(var del_path in delete_paths)
                    {
                        if (del_path.IsDirectory)
                        {
                            if (file_name.IndexOf(del_path.FullName) > -1)
                            {
                                file_name = file_name.Substring(del_path.FullName.Length);
                                found = true;
                                break;
                            }
                        }
                    }
                    if (found)
                    {
                        file_names.Add(new KeyValuePair<string, long>(file_name, file.Length));
                    }
                    else
                    {
                        file_names.Add(new KeyValuePair<string, long>(file.Name, file.Length));
                    }
                }
            }

            file_names.Sort(delegate (KeyValuePair<string, long> c1, KeyValuePair<string, long> c2) { return c1.Key.CompareTo(c2.Key); });

            return file_names;
        }

        public Dictionary<string, int> GetExtCounts()
        {
            Dictionary<string, int> type_counts = new Dictionary<string, int>();

            foreach (var file in file_full_list)
            {
                if (!file.IsDirectory)
                {
                    string ext = file.Extension;
                    if (string.IsNullOrEmpty(ext))
                    {
                        ext = file.ToString();
                    }
                    if (!type_counts.ContainsKey(ext))
                    {
                        type_counts.Add(ext, 1);
                    }
                    else
                    {
                        type_counts[ext] = type_counts[ext] + 1;
                    }
                }
            }

            return type_counts;
        }

    }
}
