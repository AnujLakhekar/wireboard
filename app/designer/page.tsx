import Editor, { EditorHeaderBar } from "./(components)/(ui)/Editor";
import SelectedToolPanel from "./(components)/(ui)/SelectedToolPanel";
import ToolsSideBar from "./(components)/(ui)/ToolsSideBar";


export default function DesignerPage() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-100">
      {/* Sticky Header Row */}
      <EditorHeaderBar />
      
      {/* Lower Operational Panel Row */}
      <div className="flex-1 flex overflow-hidden">
        <ToolsSideBar />
        <SelectedToolPanel />
        <Editor />
      </div>
    </div>
  );
}