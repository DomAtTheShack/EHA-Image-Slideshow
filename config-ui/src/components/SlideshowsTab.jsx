import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Section, Button } from './UIComponents';

export default function SlideshowsTab({ imageLists, allImages, selectedListId, onSelectList, onAddImageToList, onRemoveImageFromList, onReorderList }) {

    const selectedList = imageLists.find(l => l._id === selectedListId);

    const handleOnDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(selectedList.images);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        const reorderedImageIds = items.map(img => img._id);
        onReorderList(selectedListId, reorderedImageIds);
    };

    return (
        <Section title="Slideshow Management">
            <label className="block text-gray-400 text-sm font-bold mb-2">Select a Slideshow to Manage</label>
            <select onChange={(e) => onSelectList(e.target.value)} value={selectedListId} className="w-full md:w-1/2 p-2 bg-gray-700 rounded mb-6 border-gray-600 focus:ring-2 focus:ring-yellow-500">
                {imageLists.map(list => <option key={list._id} value={list._id}>{list.name}</option>)}
            </select>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Current Slideshow (Draggable) */}
                <div>
                    <h3 className="text-xl font-semibold mb-2">Images in "{selectedList?.name}"</h3>
                    <DragDropContext onDragEnd={handleOnDragEnd}>
                        <Droppable droppableId="slideshowImages">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="bg-gray-700 p-4 rounded-lg min-h-[400px]">
                                    {selectedList?.images.map((image, index) => (
                                        <Draggable key={image._id} draggableId={image._id} index={index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="flex items-center justify-between p-2 mb-2 bg-gray-800 rounded border-b border-gray-600">
                                                    <img src={image.url} alt={image.credit} className="w-16 h-10 object-cover rounded mr-4" />
                                                    <span className="flex-grow">{image.credit || 'No credit'}</span>
                                                    <Button onClick={() => onRemoveImageFromList(image._id)} color="red">Remove</Button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                {/* Image Library (to add from) */}
                <div>
                    <h3 className="text-xl font-semibold mb-2">Add Images from Library</h3>
                    <div className="bg-gray-700 p-4 rounded-lg min-h-[400px] max-h-[600px] overflow-y-auto">
                        {allImages.map(image => (
                            <div key={image._id} className="flex items-center justify-between p-2 border-b border-gray-600 hover:bg-gray-600 transition-colors duration-200">
                                <img src={image.url} alt={image.credit} className="w-16 h-10 object-cover rounded mr-4" />
                                <span className="flex-grow">{image.credit || 'No credit'}</span>
                                <Button onClick={() => onAddImageToList(image._id)} color="blue" disabled={selectedList?.images.some(img => img._id === image._id)}>
                                    Add
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Section>
    );
}

