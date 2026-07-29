'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import {
  Background,
  Connection,
  Controls,
  Edge,
  Handle,
  MarkerType,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FiTrash2 } from 'react-icons/fi';
import { DefaultText, Label } from '@/shared/components/Texts';
import { DefaultAutocompleteInput } from '@/shared/components/Inputs';
import { SecondaryButton } from '@/shared/components/Buttons';
import { ImageAvatarPreview } from '@/shared/components/ImageAvatarPreview';
import {
  ICharacterListItem,
  ICharacterSummary,
  FamilyRelationshipType,
} from '@/shared/interfaces';
import { APP_COLORS } from '@/shared/constants';

export interface FamilyGenealogyMember {
  character: ICharacterSummary;
  positionX: number;
  positionY: number;
}

export interface FamilyGenealogyRelationship {
  /**
   * Presente quando o vínculo já veio persistido do backend (modo leitura/edição);
   * ausente para vínculos recém-criados em memória antes do salvar — nesse caso,
   * quem consome o componente deve fornecer um identificador local estável (ex.:
   * um id gerado no cliente) para que a remoção via `onRemoveRelationship`
   * funcione antes da persistência.
   */
  id?: string;
  sourceCharacterId: string;
  targetCharacterId: string;
  type: FamilyRelationshipType;
}

export interface FamilyGenealogyBoardProps {
  mode: 'editable' | 'readOnly';
  members: FamilyGenealogyMember[];
  relationships: FamilyGenealogyRelationship[];
  characterSearchOptions?: ICharacterListItem[];
  characterSearchText?: string;
  onCharacterSearchTextChange?: (text: string) => void;
  onAddMember?: (character: ICharacterListItem) => void;
  onRemoveMember?: (characterId: string) => void;
  onPositionChange?: (
    characterId: string,
    position: { x: number; y: number },
  ) => void;
  onCreateRelationship?: (relationship: {
    sourceCharacterId: string;
    targetCharacterId: string;
    type: FamilyRelationshipType;
  }) => void;
  onRemoveRelationship?: (relationshipId: string) => void;
}

interface CharacterCardNodeData extends Record<string, unknown> {
  character: ICharacterSummary;
  mode: 'editable' | 'readOnly';
  onRemove?: () => void;
}

type CharacterCardNode = Node<CharacterCardNodeData, 'characterCard'>;

const CharacterCardNode = ({ data }: NodeProps<CharacterCardNode>) => {
  const { character, mode, onRemove } = data;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2"
      style={{
        border: `1px solid ${APP_COLORS.goldDark}`,
        borderRadius: '6px',
        backgroundColor: APP_COLORS.parchmentLight,
        minWidth: 190,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: APP_COLORS.goldDark,
          opacity: mode === 'readOnly' ? 0 : 1,
          pointerEvents: mode === 'readOnly' ? 'none' : undefined,
        }}
      />
      <ImageAvatarPreview
        imageUrl={character.referenceImage}
        alt={character.name}
      />
      <DefaultText className="flex-1">{character.name}</DefaultText>
      {mode === 'editable' && onRemove && (
        <IconButton
          aria-label={`Remover ${character.name} da árvore`}
          size="small"
          onClick={onRemove}
          sx={{ color: APP_COLORS.textBrownDark }}
        >
          <FiTrash2 />
        </IconButton>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: APP_COLORS.goldDark,
          opacity: mode === 'readOnly' ? 0 : 1,
          pointerEvents: mode === 'readOnly' ? 'none' : undefined,
        }}
      />
    </div>
  );
};

const NODE_TYPES = { characterCard: CharacterCardNode };

const RELATIONSHIP_LABELS: Record<FamilyRelationshipType, string> = {
  parent: 'Filho(a) de',
  spouse: 'Cônjuge',
};

const buildEdgeFromRelationship = (
  relationship: FamilyGenealogyRelationship,
  index: number,
  editable: boolean,
): Edge => {
  const id =
    relationship.id ??
    `draft-${relationship.sourceCharacterId}-${relationship.targetCharacterId}-${index}`;

  const isParent = relationship.type === 'parent';

  return {
    id,
    source: relationship.sourceCharacterId,
    target: relationship.targetCharacterId,
    label: RELATIONSHIP_LABELS[relationship.type],
    type: isParent ? 'smoothstep' : 'straight',
    style: isParent
      ? { stroke: APP_COLORS.goldDark, strokeWidth: 2 }
      : { stroke: APP_COLORS.gold, strokeWidth: 2, strokeDasharray: '6 4' },
    markerEnd: isParent
      ? { type: MarkerType.ArrowClosed, color: APP_COLORS.goldDark }
      : undefined,
    selectable: editable,
    deletable: editable,
    labelStyle: { fill: APP_COLORS.textBrownDark, fontWeight: 600 },
    labelBgStyle: { fill: APP_COLORS.parchmentLight },
  };
};

const FamilyGenealogyBoardInner = ({
  mode,
  members,
  relationships,
  characterSearchOptions = [],
  characterSearchText = '',
  onCharacterSearchTextChange,
  onAddMember,
  onRemoveMember,
  onPositionChange,
  onCreateRelationship,
  onRemoveRelationship,
}: FamilyGenealogyBoardProps) => {
  const isEditable = mode === 'editable';

  const [nodes, setNodes, onNodesChange] = useNodesState<CharacterCardNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedCharacter, setSelectedCharacter] =
    useState<ICharacterListItem | null>(null);
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(
    null,
  );
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const memberIdsKey = useMemo(
    () => members.map((member) => member.character.id).join(','),
    [members],
  );

  const onRemoveMemberRef = useRef(onRemoveMember);
  useEffect(() => {
    onRemoveMemberRef.current = onRemoveMember;
  }, [onRemoveMember]);

  useEffect(() => {
    setNodes(
      members.map((member) => ({
        id: member.character.id,
        type: 'characterCard',
        position: { x: member.positionX, y: member.positionY },
        data: {
          character: member.character,
          mode,
          // Lê a versão mais recente de `onRemoveMember` via ref em vez de capturar a
          // prop diretamente: este efeito só roda quando `memberIdsKey`/`mode` mudam
          // (não a cada arraste), então capturar a prop aqui a deixaria "congelada"
          // com o snapshot de `members`/`relationships` do momento em que o efeito
          // rodou pela última vez.
          onRemove: isEditable
            ? () => onRemoveMemberRef.current?.(member.character.id)
            : undefined,
        },
        draggable: isEditable,
        connectable: isEditable,
        deletable: false,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberIdsKey, mode]);

  const relationshipsKey = useMemo(
    () =>
      relationships
        .map(
          (relationship) =>
            `${relationship.id ?? ''}-${relationship.sourceCharacterId}-${relationship.targetCharacterId}-${relationship.type}`,
        )
        .join('|'),
    [relationships],
  );

  useEffect(() => {
    setEdges(
      relationships.map((relationship, index) =>
        buildEdgeFromRelationship(relationship, index, isEditable),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationshipsKey, mode]);

  const handleNodeDragStop = useCallback(
    (_event: unknown, node: CharacterCardNode) => {
      onPositionChange?.(node.id, node.position);
    },
    [onPositionChange],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!isEditable || !connection.source || !connection.target) {
        return;
      }

      if (connection.source === connection.target) {
        return;
      }

      setPendingConnection(connection);
    },
    [isEditable],
  );

  const handleConnectEnd = useCallback((event: MouseEvent | TouchEvent) => {
    if ('clientX' in event && 'clientY' in event) {
      setMenuPosition({ top: event.clientY, left: event.clientX });
    }
  }, []);

  const handleChooseRelationshipType = (type: FamilyRelationshipType) => {
    if (pendingConnection?.source && pendingConnection?.target) {
      onCreateRelationship?.({
        sourceCharacterId: pendingConnection.source,
        targetCharacterId: pendingConnection.target,
        type,
      });
    }
    setPendingConnection(null);
    setMenuPosition(null);
  };

  const handleCloseRelationshipMenu = () => {
    setPendingConnection(null);
    setMenuPosition(null);
  };

  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      deletedEdges.forEach((edge) => onRemoveRelationship?.(edge.id));
    },
    [onRemoveRelationship],
  );

  const selectedIds = members.map((member) => member.character.id);
  const addMemberOptions = characterSearchOptions.filter(
    (character) => !selectedIds.includes(character.id),
  );

  const handleAddMember = () => {
    if (!selectedCharacter) {
      return;
    }

    onAddMember?.(selectedCharacter);
    setSelectedCharacter(null);
    onCharacterSearchTextChange?.('');
  };

  return (
    <div className="flex flex-col gap-3">
      {isEditable && (
        <div className="flex flex-col gap-2">
          <Label component="span" sx={{ margin: 0 }}>
            Adicionar membro
          </Label>
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-50 flex-1">
              <DefaultAutocompleteInput<ICharacterListItem>
                id="family-board-add-member"
                options={addMemberOptions}
                getOptionLabel={(character) => character.name}
                value={selectedCharacter}
                onChange={setSelectedCharacter}
                inputValue={characterSearchText}
                onInputChange={onCharacterSearchTextChange}
                placeholder="Buscar personagem por nome"
              />
            </div>
            <SecondaryButton
              type="button"
              disabled={!selectedCharacter}
              onClick={handleAddMember}
            >
              Adicionar
            </SecondaryButton>
          </div>
          <DefaultText>
            Selecione um vínculo e pressione Delete para removê-lo.
          </DefaultText>
        </div>
      )}

      <div
        style={{
          height: 480,
          border: `1px solid ${APP_COLORS.goldDark}`,
          borderRadius: '6px',
          overflow: 'hidden',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
          onConnectEnd={handleConnectEnd}
          onEdgesDelete={handleEdgesDelete}
          nodesDraggable={isEditable}
          nodesConnectable={isEditable}
          elementsSelectable={isEditable}
          panOnDrag
          zoomOnScroll
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <Menu
        open={!!pendingConnection}
        onClose={handleCloseRelationshipMenu}
        anchorReference="anchorPosition"
        anchorPosition={menuPosition ?? { top: 0, left: 0 }}
      >
        <MenuItem onClick={() => handleChooseRelationshipType('parent')}>
          Pai/Mãe → Filho(a)
        </MenuItem>
        <MenuItem onClick={() => handleChooseRelationshipType('spouse')}>
          Cônjuge
        </MenuItem>
      </Menu>
    </div>
  );
};

export const FamilyGenealogyBoard = (props: FamilyGenealogyBoardProps) => {
  return (
    <ReactFlowProvider>
      <FamilyGenealogyBoardInner {...props} />
    </ReactFlowProvider>
  );
};
