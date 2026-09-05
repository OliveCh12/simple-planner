import { SettingsSection } from "@/components/settings/SettingsSection";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

const SHORTCUTS: { title: string; description: string; keys: string[] }[] = [
  {
    title: "Switch view",
    description: "Calendar shows a year, month, week or day (Y M W D) with the active objectives above the grid. Roadmap draws every item as a bar on a continuous time axis, grouped by objective (Y M W D H).",
    keys: ["Calendar", "Roadmap"],
  },
  {
    title: "Display",
    description: "The sliders menu chooses what the grid shows: completed items, subtasks on the roadmap, or only the AI queue. The panel button on the left opens Plan: goals for this period, work still to schedule, and prep for events that have some.",
    keys: ["Display", "Plan"],
  },
  {
    title: "Undo and redo",
    description: "Every create, move, edit or delete can be taken back and put back, one step at a time, for the calendar you are in. Text fields keep their own undo while you type.",
    keys: ["⌘Z", "⇧⌘Z"],
  },
  {
    title: "Act on the selected item",
    description: "Delete removes it (a repeating item asks which occurrences), ⌘D makes a copy next to it, N starts a new event on the selected day or hour.",
    keys: ["⌫", "⌘D", "N"],
  },
  {
    title: "Views and zoom keys",
    description: "V flips between Calendar and Roadmap. Y, M, W, D pick the zoom; H (hours) only in the roadmap. ? opens this page.",
    keys: ["V", "Y", "M", "W", "D", "?"],
  },
  {
    title: "Zoom in or out",
    description: "Steps through years, months, weeks, days and hours, keeping the time under the cursor in place. Ctrl or ⌘ with the mouse wheel, or a trackpad pinch, does the same.",
    keys: ["-", "+"],
  },
  {
    title: "Previous or next unit",
    description: "Scrolls the timeline by one unit of the current scale (year, month, week, day or hour).",
    keys: ["←", "→"],
  },
  {
    title: "Jump to now",
    description: "Centres the current time on the timeline.",
    keys: ["T"],
  },
  {
    title: "Pan the timeline",
    description: "Hold Space and drag anywhere on the board. The mouse wheel also scrolls sideways.",
    keys: ["Space", "Drag"],
  },
  {
    title: "Move or resize an item",
    description: "In week and day views, drag an event or task to another slot, or drag its edges to change the start and end. Times snap to 15 minutes. Recurring items ask whether to edit this occurrence or the series. The roadmap still uses horizontal drag on bars.",
    keys: ["Drag"],
  },
  {
    title: "Add an item",
    description: "Type in the quick-add field. Tokens: every weekday|daily|weekly|monthly, 7am or 19:00, until Aug 31, #category, @ai or @human. Drag on an empty roadmap lane to create on the swept range.",
    keys: ["Enter"],
  },
  {
    title: "AI queue",
    description: "In the Display menu, “AI queue only” keeps items whose executor is AI and that are not completed or cancelled.",
    keys: ["Display"],
  },
  {
    title: "Save a task",
    description: "While editing a title, saves the changes and closes the editor.",
    keys: ["Enter"],
  },
  {
    title: "Close details",
    description: "Closes the details pane and gives the calendar its full width back. Esc also discards unsaved title and note changes while editing.",
    keys: ["Esc"],
  },
];

export default function ShortcutsSettingsPage() {
  return (
    <SettingsSection title="Shortcuts" description="Keyboard and pointer shortcuts in a calendar.">
      <ItemGroup className="rounded-lg border">
        {SHORTCUTS.map((shortcut, index) => (
          <div key={shortcut.title}>
            {index > 0 && <ItemSeparator />}
            <Item size="sm">
              <ItemContent>
                <ItemTitle>{shortcut.title}</ItemTitle>
                <ItemDescription>{shortcut.description}</ItemDescription>
              </ItemContent>
              <ItemActions>
                <KbdGroup>
                  {shortcut.keys.map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </KbdGroup>
              </ItemActions>
            </Item>
          </div>
        ))}
      </ItemGroup>
    </SettingsSection>
  );
}
