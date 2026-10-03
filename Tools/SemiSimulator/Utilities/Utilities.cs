using Cmf.Foundation.BusinessObjects;
using System.Data;
using System.Text;
using System.Xml;
using System.Xml.Linq;

namespace SemiSimulator
{
    public static class Utilities
    {
        /// <summary>
        /// Convert a NgpDataSet to a DataSet
        /// </summary>
        /// <param name="dsd">NgpDataSet to convert</param>
        /// <returns>Returns a DataSet with all information of the NgpDataSet</returns>
        public static DataSet ToDataSet(NgpDataSet dsd)
        {
            DataSet ds = new DataSet();

            //Insert schema
            TextReader a = new StringReader(dsd.XMLSchema);
            XmlReader readerS = new XmlTextReader(a);
            ds.ReadXmlSchema(readerS);
            XDocument xdS = XDocument.Parse(dsd.XMLSchema);

            //Insert data
            UTF8Encoding encoding = new UTF8Encoding();
            Byte[] byteArray = encoding.GetBytes(dsd.DataXML);
            MemoryStream stream = new MemoryStream(byteArray);

            XmlReader reader = new XmlTextReader(stream);
            ds.ReadXml(reader);
            XDocument xd = XDocument.Parse(dsd.DataXML);

            foreach (DataTable dt in ds.Tables)
            {
                var rs = from row in xd.Descendants(dt.TableName)
                         select row;

                int i = 0;
                foreach (var r in rs)
                {
                    DataRowState state = DataRowState.Added;
                    if (r.Attribute("RowState") != null)
                    {
                        state = (DataRowState)Enum.Parse(typeof(DataRowState), r.Attribute("RowState").Value);
                    }

                    DataRow dr = dt.Rows[i];
                    dr.AcceptChanges();

                    if (state == DataRowState.Deleted)
                    {
                        dr.Delete();
                    }
                    else if (state == DataRowState.Added)
                    {
                        dr.SetAdded();
                    }
                    else if (state == DataRowState.Modified)
                    {
                        dr.SetModified();
                    }

                    i++;
                }
            }

            return ds;
        }
    }
}
