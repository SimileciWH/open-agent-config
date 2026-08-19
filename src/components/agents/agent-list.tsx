import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { clsx } from "clsx";
import { GripVertical } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { AgentMascot } from "@/components/shared/agent-mascot/agent-mascot";
import type { AgentDetail, AgentInfo } from "@/lib/types";
import { agentDisplayName } from "@/lib/types";
import { useAgentConfigStore } from "@/stores/agent-config-store";
import { useAgentStore } from "@/stores/agent-store";
import { useUIStore } from "@/stores/ui-store";

function SortableAgentItem({
  agent,
  info,
  isSelected,
  onSelect,
  onEnabledChange,
}: {
  agent: AgentDetail;
  info: AgentInfo | undefined;
  isSelected: boolean;
  onSelect: () => void;
  onEnabledChange: (enabled: boolean) => void;
}) {
  const { t } = useTranslation("agents");
  const enabled = info?.enabled ?? true;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: agent.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const status = !agent.detected
    ? t("list.notDetected")
    : enabled
      ? t("list.detected")
      : t("list.disabled");

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group flex items-center rounded-xl border border-transparent transition-colors",
        isDragging && "z-10 opacity-50",
        isSelected
          ? "border-primary/15 bg-accent text-accent-foreground"
          : "text-foreground/80 hover:bg-accent/45",
        !enabled && "opacity-65",
      )}
    >
      <button
        type="button"
        aria-label={t("list.reorderAria", {
          agent: agentDisplayName(agent.name),
        })}
        className="flex w-6 shrink-0 cursor-grab items-center justify-center self-stretch text-muted-foreground/30 hover:text-muted-foreground/65 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 py-2.5 pr-1 text-left"
      >
        <AgentMascot name={agent.name} size={18} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold">
            {agentDisplayName(agent.name)}
          </span>
          <span
            className={clsx(
              "block text-[10px] leading-tight",
              agent.detected && enabled
                ? "text-emerald-600 dark:text-emerald-300"
                : "text-muted-foreground",
            )}
          >
            {status}
          </span>
        </span>
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={t(enabled ? "list.disableAria" : "list.enableAria", {
          agent: agentDisplayName(agent.name),
        })}
        title={t(enabled ? "list.disableAria" : "list.enableAria", {
          agent: agentDisplayName(agent.name),
        })}
        onClick={() => onEnabledChange(!enabled)}
        className="mr-2 shrink-0 rounded-full p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <span
          className={clsx(
            "relative block h-4 w-7 rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-muted-foreground/25",
          )}
        >
          <span
            className={clsx(
              "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform",
              enabled ? "translate-x-3.5" : "translate-x-0.5",
            )}
          />
        </span>
      </button>
    </div>
  );
}

export function AgentList() {
  const { t } = useTranslation("agents");
  const agentDetails = useAgentConfigStore((s) => s.agentDetails);
  const selectedAgent = useAgentConfigStore((s) => s.selectedAgent);
  const selectAgent = useAgentConfigStore((s) => s.selectAgent);
  const agentOrder = useAgentStore((s) => s.agentOrder);
  const reorderAgents = useAgentStore((s) => s.reorderAgents);
  const agents = useAgentStore((s) => s.agents);
  const setEnabled = useAgentStore((s) => s.setEnabled);
  const agentVisibility = useUIStore((s) => s.agentVisibility);
  const setAgentVisibility = useUIStore((s) => s.setAgentVisibility);

  const infoByName = useMemo(
    () => new Map(agents.map((agent) => [agent.name, agent])),
    [agents],
  );
  const sorted = useMemo(
    () =>
      [...agentDetails].sort((a, b) => {
        const ai = agentOrder.indexOf(a.name);
        const bi = agentOrder.indexOf(b.name);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }),
    [agentDetails, agentOrder],
  );
  const visible = useMemo(
    () =>
      agentVisibility === "detected"
        ? sorted.filter((agent) => agent.detected)
        : sorted,
    [agentVisibility, sorted],
  );
  const visibleNames = useMemo(
    () => new Set(visible.map((agent) => agent.name)),
    [visible],
  );
  const hiddenNames = useMemo(
    () =>
      new Set(
        sorted
          .filter((agent) => !visibleNames.has(agent.name))
          .map((agent) => agent.name),
      ),
    [sorted, visibleNames],
  );

  useEffect(() => {
    if (visible.length === 0) {
      if (selectedAgent) selectAgent(null);
      return;
    }
    if (!selectedAgent || !visibleNames.has(selectedAgent)) {
      selectAgent(visible[0]?.name ?? null);
    }
  }, [selectAgent, selectedAgent, visible, visibleNames]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const displayedNames = visible.map((agent) => agent.name);
      const oldIndex = displayedNames.indexOf(active.id as string);
      const newIndex = displayedNames.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedVisible = arrayMove(displayedNames, oldIndex, newIndex);
      const fullOrder: string[] = [];
      let visibleIndex = 0;
      for (const name of agentOrder) {
        if (hiddenNames.has(name)) fullOrder.push(name);
        else if (visibleIndex < reorderedVisible.length) {
          fullOrder.push(reorderedVisible[visibleIndex]);
          visibleIndex++;
        }
      }
      while (visibleIndex < reorderedVisible.length) {
        fullOrder.push(reorderedVisible[visibleIndex]);
        visibleIndex++;
      }
      reorderAgents(fullOrder);
    },
    [agentOrder, hiddenNames, reorderAgents, visible],
  );

  return (
    <div className="flex flex-col gap-1 p-2">
      <div className="space-y-2 px-1 pb-2 pt-1">
        <div className="flex items-center justify-between px-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {t("list.header")}
          </span>
          <span className="text-[10px] tabular-nums text-muted-foreground/70">
            {visible.length}/{sorted.length}
          </span>
        </div>
        <fieldset
          aria-label={t("list.filterAria")}
          className="grid grid-cols-2 rounded-lg bg-muted/60 p-0.5"
        >
          {(["all", "detected"] as const).map((visibility) => (
            <button
              key={visibility}
              type="button"
              aria-pressed={agentVisibility === visibility}
              onClick={() => setAgentVisibility(visibility)}
              className={clsx(
                "rounded-md px-2 py-1.5 text-[10px] font-semibold transition-colors",
                agentVisibility === visibility
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(visibility === "all" ? "list.all" : "list.detectedOnly")}
            </button>
          ))}
        </fieldset>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-3 py-7 text-center text-xs text-muted-foreground">
          {t("list.noneForFilter")}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visible.map((agent) => agent.name)}
            strategy={verticalListSortingStrategy}
          >
            {visible.map((agent) => (
              <SortableAgentItem
                key={agent.name}
                agent={agent}
                info={infoByName.get(agent.name)}
                isSelected={agent.name === selectedAgent}
                onSelect={() => selectAgent(agent.name)}
                onEnabledChange={(enabled) =>
                  void setEnabled(agent.name, enabled)
                }
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
